import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Trash2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  User,
  Calendar,
  Building2,
  Hash,
  UserCheck,
  Info,
  Layers,
  Target,
  CheckCircle,
  XCircle,
  Pencil,
  Save,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface RequestSubmission {
  id: number;
  department: string;
  title: string;
  content: string;
  submitted_by: string;
  submitted_at: string;
  line_id?: string;
  ppid?: string;
  Max_TAT?: string | number | null;
  change_request_items?: string;
  status?: string;
  assignee?: string;
}

interface DetailedInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: RequestSubmission | null;
  onSubmissionUpdate?: (submission: RequestSubmission) => void;
}

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | null;

export default function DetailedInfoModal({
  isOpen,
  onClose,
  submission,
  onSubmissionUpdate,
}: DetailedInfoModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const isManager = user?.auth === "MANAGER";

  // 기본 크기
  const DEFAULT_WIDTH = 1440;
  const DEFAULT_HEIGHT = 840;
  const [modalSize, setModalSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isResizing, setIsResizing] = useState(false);
  const [cursorStyle, setCursorStyle] = useState<React.CSSProperties["cursor"]>("default");
  const [activeCursor, setActiveCursor] = useState<React.CSSProperties["cursor"]>("default");
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevSize, setPrevSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

  // TAT 인라인 편집
  const [maxTatInput, setMaxTatInput] = useState<string>("");
  const [isEditingTat, setIsEditingTat] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null
  );

  // 상세내용 영역 refs
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const detailContentRef = useRef<HTMLDivElement>(null);

  // 드래그 스크롤 상태
  const panStartRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // 줌 상태
  const [zoomLevel, setZoomLevel] = useState(1);
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;

  // 상태별 스타일
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "완료":
      case "작성완료":
        return { color: "text-green-700", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", text: "작성완료" };
      case "진행중":
        return { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", text: "진행중" };
      case "담당자확인대기중":
        return { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-500", text: "담당자 확인 대기중" };
      case "반려":
        return { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "반려" };
      case "대기중":
      default:
        return { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: status || "대기중" };
    }
  };

  // 모달 재오픈 시 초기화
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setIsMaximized(false);
      setModalSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
      setIsEditingTat(false);
    }
  }, [isOpen]);

  // 삭제
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/request-submissions/${id}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/request-submissions"] });
      onClose();
      toast({ title: "삭제 완료", description: "의뢰가 성공적으로 삭제되었습니다." });
    },
    onError: (error: any) => {
      toast({
        title: "삭제 실패",
        description: error.message || "의뢰 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // Max TAT 갱신
  const updateMaxTatMutation = useMutation({
    mutationFn: async ({ id, maxTat }: { id: number; maxTat: number | null }) => {
      const response = await apiRequest("PATCH", `/api/request-submissions/${id}`, { Max_TAT: maxTat });
      return await response.json();
    },
    onSuccess: (updated: RequestSubmission) => {
      queryClient.invalidateQueries({ queryKey: ["/api/request-submissions"] });
      setMaxTatInput(updated.Max_TAT != null ? String(updated.Max_TAT) : "");
      onSubmissionUpdate?.(updated);
      setIsEditingTat(false);
      toast({ title: "Max TAT가 업데이트되었습니다.", description: "변경 사항이 저장되었습니다." });
    },
    onError: (error: any) => {
      toast({
        title: "Max TAT 업데이트 실패",
        description: error.message || "Max TAT를 업데이트하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 제출건 바뀔 때 TAT 초기화
  useEffect(() => {
    if (submission) {
      setMaxTatInput(submission.Max_TAT != null ? String(submission.Max_TAT) : "");
    } else {
      setMaxTatInput("");
    }
  }, [submission?.id, submission?.Max_TAT]);

  const parsedMaxTat = useMemo(() => {
    const trimmed = maxTatInput.trim();
    if (trimmed === "") return null;        // 빈칸 -> null 저장
    if (!/^\d+$/.test(trimmed)) return NaN;  // 숫자 외 입력
    return Number(trimmed);
  }, [maxTatInput]);

  const isMaxTatValid = parsedMaxTat === null || (!Number.isNaN(parsedMaxTat) && parsedMaxTat >= 0);

  const handleMaxTatSave = () => {
    if (!submission) return;
    if (!isMaxTatValid || Number.isNaN(parsedMaxTat ?? undefined)) {
      toast({
        title: "유효하지 않은 값",
        description: "Max TAT는 0 이상의 정수로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    updateMaxTatMutation.mutate({ id: submission.id, maxTat: parsedMaxTat });
  };

  // 결재 / 반려
  const approveSubmissionMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("PUT", `/api/request-submissions/${id}`, { action: "approve" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/request-submissions"] });
      onClose();
      toast({ title: "결재 완료", description: "의뢰가 성공적으로 결재되었습니다." });
    },
    onError: (error: any) => {
      toast({
        title: "결재 실패",
        description: error.message || "의뢰 결재 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const rejectSubmissionMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("PUT", `/api/request-submissions/${id}`, { action: "reject" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/request-submissions"] });
      onClose();
      toast({ title: "반려 완료", description: "의뢰가 반려 처리되었습니다." });
    },
    onError: (error: any) => {
      toast({
        title: "반려 실패",
        description: error.message || "의뢰 반려 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 리사이즈 커서 계산
  const getCursorStyle = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const edge = 10;
    const isLeft = x < edge;
    const isRight = x > rect.width - edge;
    const isTop = y < edge;
    const isBottom = y > rect.height - edge;

    if (isTop && isLeft) return "nw-resize";
    if (isTop && isRight) return "ne-resize";
    if (isBottom && isLeft) return "sw-resize";
    if (isBottom && isRight) return "se-resize";
    if (isTop) return "n-resize";
    if (isBottom) return "s-resize";
    if (isLeft) return "w-resize";
    if (isRight) return "e-resize";
    return "default";
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing || isMaximized) return;
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest(".modal-header") || target.closest(".sidebar")) {
        setCursorStyle("default");
        return;
      }
      setCursorStyle(getCursorStyle(e));
    },
    [isResizing, isMaximized, getCursorStyle]
  );

  const toHandle = (cursor: string): ResizeHandle => {
    switch (cursor) {
      case "n-resize": return "n";
      case "s-resize": return "s";
      case "e-resize": return "e";
      case "w-resize": return "w";
      case "ne-resize": return "ne";
      case "nw-resize": return "nw";
      case "se-resize": return "se";
      case "sw-resize": return "sw";
      default: return null;
    }
  };

  const handleBorderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest(".modal-header") || target.closest(".sidebar")) return;

      const cursor = getCursorStyle(e);
      const handle = toHandle(cursor);
      if (!handle) return;

      e.preventDefault();
      setIsResizing(true);
      setActiveCursor(cursor as React.CSSProperties["cursor"]);

      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: modalSize.width,
        height: modalSize.height,
      };

      const handleMouseMoveResize = (ev: MouseEvent) => {
        if (!resizeStartRef.current || !handle) return;
        const deltaX = ev.clientX - resizeStartRef.current.x;
        const deltaY = ev.clientY - resizeStartRef.current.y;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;

        if (handle.includes("e")) newWidth = resizeStartRef.current.width + deltaX;
        if (handle.includes("w")) newWidth = resizeStartRef.current.width - deltaX;
        if (handle.includes("s")) newHeight = resizeStartRef.current.height + deltaY;
        if (handle.includes("n")) newHeight = resizeStartRef.current.height - deltaY;

        const minW = 700;
        const minH = 500;
        const maxW = Math.floor(window.innerWidth * 0.95);
        const maxH = Math.floor(window.innerHeight * 0.9);

        newWidth = Math.max(minW, Math.min(newWidth, maxW));
        newHeight = Math.max(minH, Math.min(newHeight, maxH));

        setModalSize({ width: newWidth, height: newHeight });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        setActiveCursor("default");
        resizeStartRef.current = null;
        document.removeEventListener("mousemove", handleMouseMoveResize);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMoveResize);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [modalSize, isMaximized, getCursorStyle]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy년 MM월 dd일 HH:mm", { locale: ko });
  };

  // 드래그 스크롤
  const onDetailPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("a, button, input, textarea, select")) return;
    if (e.button !== 0 && e.button !== 1) return;

    const el = detailScrollRef.current;
    if (!el) return;

    el.style.userSelect = "none";
    el.style.cursor = "grabbing";
    setIsPanning(true);

    el.setPointerCapture?.(e.pointerId);
    panStartRef.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };

    e.preventDefault();
  };

  const onDetailPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !panStartRef.current) return;
    const el = detailScrollRef.current;
    if (!el) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    el.scrollLeft = panStartRef.current.left - dx;
    el.scrollTop = panStartRef.current.top - dy;
  };

  const endDetailPan = (e?: React.PointerEvent<HTMLDivElement>) => {
    const el = detailScrollRef.current;
    if (!el) return;
    setIsPanning(false);
    panStartRef.current = null;
    el.style.cursor = "grab";
    el.style.removeProperty("user-select");
    if (e) el.releasePointerCapture?.(e.pointerId);
  };

  // 휠 줌
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * delta));
    setZoomLevel(newZoom);
  };

  const adjustZoom = (delta: number) => {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
    setZoomLevel(newZoom);
  };

  // 최대화/복원
  const toggleMaximize = () => {
    if (isMaximized) {
      setModalSize(prevSize);
      setIsMaximized(false);
    } else {
      setPrevSize(modalSize);
      setModalSize({
        width: Math.floor(window.innerWidth * 0.95),
        height: Math.floor(window.innerHeight * 0.9),
      });
      setIsMaximized(true);
    }
  };

  if (!isOpen || !submission) return null;

  const statusConfig = getStatusConfig(submission.status);
  const knox_id_from_session =
    user?.mail_knox?.split?.("@")?.[0]?.trim() ?? user?.username ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        ref={modalRef}
        className="bg-gray-50 rounded-2xl shadow-2xl relative select-none transition-all duration-300 ease-out overflow-hidden"
        style={{
          width: `${modalSize.width}px`,
          height: `${modalSize.height}px`,
          maxWidth: "95vw",
          maxHeight: "90vh",
          cursor: isResizing ? activeCursor : cursorStyle,
          boxSizing: "border-box",
          display: "flex",
        }}
        onMouseDown={handleBorderMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCursorStyle("default")}
      >
        {/* 좌측 사이드바 */}
        <div className="sidebar w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
          {/* 사이드바 헤더 */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot} ${submission.status === '담당자확인대기중' ? 'animate-pulse' : ''}`} />
                <span className={`text-sm font-semibold ${statusConfig.color}`}>{statusConfig.text}</span>
              </div>
              <span className="text-xs text-gray-400">#{submission.id}</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg line-clamp-2">{submission.title}</h3>
          </div>

          {/* 사이드바 정보 */}
          <ScrollArea className="flex-1 p-5">
            <div className="space-y-6">
              {/* 기본 정보 섹션 */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">기본 정보</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Line ID</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{submission.line_id || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Layers className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">PPID</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{submission.ppid || "-"}</p>
                    </div>
                  </div>

                  {/* TAT 표시 + (MANAGER 전용) 연필 아이콘 / 인라인 입력 */}
                  <div className="flex items-start gap-3">
                    <Target className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">TAT</p>

                      {/* 보기 모드 */}
                      {!isEditingTat && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {maxTatInput?.trim() !== "" ? `${maxTatInput}일` : "-"}
                          </p>

                          {/* MANAGER일 때만 연필 아이콘 노출 */}
                          {isManager && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-500 hover:text-gray-700"
                              onClick={() => setIsEditingTat(true)}
                              title="TAT 수정"
                              aria-label="TAT 수정"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}

                      {/* 편집 모드 (MANAGER만 진입 가능) */}
                      {isEditingTat && isManager && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={maxTatInput}
                            onChange={(e) => {
                              const onlyDigits = e.target.value.replace(/[^\d]/g, "");
                              setMaxTatInput(onlyDigits);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleMaxTatSave();
                              } else if (e.key === "Escape") {
                                setMaxTatInput(submission?.Max_TAT != null ? String(submission.Max_TAT) : "");
                                setIsEditingTat(false);
                              }
                            }}
                            className="h-8 w-24"
                            placeholder="일수"
                            inputMode="numeric"
                            pattern="\d*"
                            autoFocus
                          />
                          <span className="text-sm text-gray-700">일</span>

                          {/* 저장 아이콘 버튼 */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleMaxTatSave}
                            className="h-8 w-8"
                            disabled={updateMaxTatMutation.isPending}
                            title="저장"
                            aria-label="저장"
                          >
                            <Save className="h-4 w-4" />
                          </Button>

                          {/* 취소 아이콘 버튼 */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setMaxTatInput(submission?.Max_TAT != null ? String(submission.Max_TAT) : "");
                              setIsEditingTat(false);
                            }}
                            className="h-8 w-8"
                            disabled={updateMaxTatMutation.isPending}
                            title="취소"
                            aria-label="취소"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 담당자 정보 섹션 */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">담당자 정보</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">상신자</p>
                      <p className="text-sm font-medium text-gray-900">{submission.submitted_by || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">부서</p>
                      <p className="text-sm font-medium text-gray-900">{submission.department || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserCheck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">담당자</p>
                      <p className="text-sm font-medium text-gray-900">{submission.assignee || "미지정"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">상신일시</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(submission.submitted_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 변경의뢰 항목 섹션 */}
              {submission.change_request_items && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">변경의뢰 항목</h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.change_request_items}</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 사이드바 푸터 - 액션 버튼 */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            {/* 결재/반려 버튼 */}
            {user &&
              submission.assignee === knox_id_from_session &&
              submission.status === "담당자확인대기중" && (
                <div className="space-y-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      if (confirm('이 의뢰를 결재하시겠습니까?\n상태가 "작성완료"로 변경됩니다.')) {
                        approveSubmissionMutation.mutate(submission.id);
                      }
                    }}
                    disabled={approveSubmissionMutation.isPending || rejectSubmissionMutation.isPending}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {approveSubmissionMutation.isPending ? "결재 중..." : "결재 승인"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm('이 의뢰를 반려하시겠습니까?\n상태가 "반려"로 변경됩니다.')) {
                        rejectSubmissionMutation.mutate(submission.id);
                      }
                    }}
                    disabled={approveSubmissionMutation.isPending || rejectSubmissionMutation.isPending}
                    className="w-full gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300"
                  >
                    <XCircle className="h-4 w-4" />
                    {rejectSubmissionMutation.isPending ? "반려 중..." : "의뢰 반려"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs"></div>
                  </div>
                </div>
              )}

            {/* 삭제 버튼 - 상신자 본인 & 완료/반려 전 */}
            {user &&
              submission.submitted_by === user.username &&
              submission.status !== "작성완료" &&
              submission.status !== "반려" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm('정말로 이 의뢰를 삭제하시겠습니까?\n삭제된 의뢰는 복구할 수 없습니다.')) {
                      deleteSubmissionMutation.mutate(submission.id);
                    }
                  }}
                  disabled={deleteSubmissionMutation.isPending}
                  className="w-full gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteSubmissionMutation.isPending ? "삭제 중..." : "의뢰 삭제"}
                </Button>
              )}

            {/* 상태 표시 */}
            {submission.status === "작성완료" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 text-center font-medium">✓ 결재 완료된 의뢰입니다</p>
              </div>
            )}
            {submission.status === "반려" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 text-center font-medium">✗ 반려된 의뢰입니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col bg-white">
          {/* 헤더 */}
          <div className="modal-header flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">상세 내용</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* 줌 컨트롤 */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustZoom(-0.1)}
                  className="h-7 w-7 p-0 hover:bg-white"
                  disabled={zoomLevel <= MIN_ZOOM}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-medium text-gray-600 min-w-[45px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustZoom(0.1)}
                  className="h-7 w-7 p-0 hover:bg-white"
                  disabled={zoomLevel >= MAX_ZOOM}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel(1)}
                  className="h-7 w-7 p-0 hover:bg-white ml-1"
                  disabled={zoomLevel === 1}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="w-px h-6 bg-gray-300" />

              {/* 창 컨트롤 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMaximize}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                title={isMaximized ? "원래 크기로" : "최대화"}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="flex-1 overflow-hidden p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="h-full relative">
              {/* 상세 내용 뷰어 */}
              <div className="absolute inset-0 bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden">
                <div
                  ref={detailScrollRef}
                  className="w-full h-full overflow-auto cursor-grab"
                  style={{ touchAction: "none" }}
                  onPointerDown={onDetailPointerDown}
                  onPointerMove={onDetailPointerMove}
                  onPointerUp={endDetailPan}
                  onPointerLeave={endDetailPan}
                  onPointerCancel={endDetailPan}
                  onWheel={handleWheel}
                >
                  <div
                    ref={detailContentRef}
                    className="p-6"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "left top",
                      width: zoomLevel < 1 ? `${100 / zoomLevel}%` : "100%",
                      minWidth: "max-content",
                    }}
                  >
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html:
                          submission.content ||
                          `
                          <div class="flex items-center justify-center h-32 text-gray-400">
                            <div class="text-center">
                              <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p>내용이 없습니다</p>
                            </div>
                          </div>
                        `,
                      }}
                    />
                  </div>
                </div>

                {/* 조작 힌트 */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <div className="bg-gray-900/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                    <span className="opacity-70">🖱️ 드래그:</span> 스크롤
                    <span className="mx-2 opacity-50">|</span>
                    <span className="opacity-70">Ctrl+휠:</span> 확대/축소
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}
