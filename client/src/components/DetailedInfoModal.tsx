import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Trash2 } from "lucide-react";
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
  eqpid?: string;
  change_request_items?: string;
  max_tat?: number;
  status?: string;
  assignee?: string;
}

interface DetailedInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: RequestSubmission | null;
  onSubmissionUpdate?: (submission: RequestSubmission) => void;
}

export default function DetailedInfoModal({ isOpen, onClose, submission, onSubmissionUpdate }: DetailedInfoModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const [modalSize, setModalSize] = useState({ width: 800, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [cursorStyle, setCursorStyle] = useState('default');
  const modalRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [maxTatInput, setMaxTatInput] = useState<string>("");

  // 삭제 뮤테이션
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/request-submissions/${id}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/request-submissions'] });
      onClose();
      toast({
        title: "삭제 완료",
        description: "의뢰가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "삭제 실패", 
        description: error.message || "의뢰 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  const updateMaxTatMutation = useMutation({
    mutationFn: async ({ id, maxTat }: { id: number; maxTat: number | null }) => {
      const response = await apiRequest("PATCH", `/api/request-submissions/${id}`, {
        max_tat: maxTat,
      });
      return await response.json();
    },
    onSuccess: (updated: RequestSubmission) => {
      queryClient.invalidateQueries({ queryKey: ['/api/request-submissions'] });
      setMaxTatInput(updated.max_tat != null ? String(updated.max_tat) : "");
      onSubmissionUpdate?.(updated);
      toast({
        title: "Max TAT가 업데이트되었습니다.",
        description: "변경 사항이 저장되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Max TAT 업데이트 실패",
        description: error.message || "Max TAT를 업데이트하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (submission) {
      setMaxTatInput(submission.max_tat != null ? String(submission.max_tat) : "");
    } else {
      setMaxTatInput("");
    }
  }, [submission?.id, submission?.max_tat]);

  const parsedMaxTat = useMemo(() => {
    const trimmed = maxTatInput.trim();
    if (trimmed === "") return null;
    if (!/^\d+$/.test(trimmed)) return NaN;
    return Number(trimmed);
  }, [maxTatInput]);

  const isMaxTatValid = parsedMaxTat === null || (!Number.isNaN(parsedMaxTat) && parsedMaxTat >= 0);
  const originalMaxTat = submission?.max_tat ?? null;
  const isMaxTatDirty = submission ? parsedMaxTat !== originalMaxTat : false;

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

    updateMaxTatMutation.mutate({
      id: submission.id,
      maxTat: parsedMaxTat,
    });
  };

  // 커서 스타일 감지 함수
  const getCursorStyle = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const edge = 25; // 가장자리 감지 영역 크기를 25px로 확대

    const isLeft = x < edge;
    const isRight = x > rect.width - edge;
    const isTop = y < edge;
    const isBottom = y > rect.height - edge;

    // 모서리 체크 (우선순위 높음)
    if (isTop && isLeft) return 'nw-resize';
    if (isTop && isRight) return 'ne-resize';
    if (isBottom && isLeft) return 'sw-resize';
    if (isBottom && isRight) return 'se-resize';
    
    // 가장자리 체크
    if (isTop) return 'n-resize';
    if (isBottom) return 's-resize';
    if (isLeft) return 'w-resize';
    if (isRight) return 'e-resize';
    
    return 'default';
  }, []);

  // 마우스 이동 핸들러
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isResizing) return;
    
    const target = e.target as HTMLElement;
    // 버튼과 헤더에서는 기본 커서 유지, 하지만 컨텐츠 영역 내부에서도 가장자리에서는 리사이즈 커서 표시
    if (target.closest('button') || target.closest('.modal-header')) {
      setCursorStyle('default');
      return;
    }
    
    const cursor = getCursorStyle(e);
    setCursorStyle(cursor);
  }, [isResizing, getCursorStyle]);

  // 모달 리사이즈 핸들러 - 테두리 드래그로 변경
  const handleBorderMouseDown = useCallback((e: React.MouseEvent) => {
    // 헤더나 버튼 영역에서는 리사이즈 방지
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.modal-header')) return;
    
    // 리사이즈 가능한 영역인지 확인
    const cursor = getCursorStyle(e);
    if (cursor === 'default') return;
    
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: modalSize.width,
      height: modalSize.height,
    };

    const handleMouseMoveResize = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      
      const newWidth = Math.max(500, resizeStartRef.current.width + deltaX);
      const newHeight = Math.max(400, resizeStartRef.current.height + deltaY);
      
      setModalSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setCursorStyle('default');
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMoveResize);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMoveResize);
    document.addEventListener('mouseup', handleMouseUp);
  }, [modalSize, getCursorStyle]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd", { locale: ko });
  };

  if (!isOpen || !submission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg border shadow-lg relative select-none"
        style={{ 
          width: `${modalSize.width}px`, 
          height: `${modalSize.height}px`,
          cursor: isResizing ? 'nw-resize' : cursorStyle
        }}
        onMouseDown={handleBorderMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCursorStyle('default')}
      >
        {/* 헤더 */}
        <div className="modal-header flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-lg font-semibold">의뢰 상신 상세 정보</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 컨텐츠 영역 - 스크롤 가능 */}
        <div className="modal-content flex-1 overflow-hidden">
          <ScrollArea 
            className="h-full p-3" 
            style={{ height: `${modalSize.height - 110}px` }}
          >
            <div className="space-y-2">
              {/* 첫 번째 줄: Line ID(1/3), PPID(1/3), 상신자, 상태, 부서, 상신일시, 담당자 */}
              <div className="grid grid-cols-7 gap-2 items-end">
                {/* Line ID - 1/3 너비 */}
                <div className="col-span-1">
                  <label className="text-xs font-medium text-gray-600">Line ID</label>
                  <div className="mt-1 p-1 bg-gray-50 rounded font-mono text-xs">
                    {submission.line_id || '-'}
                  </div>
                </div>
                {/* PPID - 1/3 너비 */}
                <div className="col-span-1">
                  <label className="text-xs font-medium text-gray-600">PPID</label>
                  <div className="mt-1 p-1 bg-gray-50 rounded font-mono text-xs">
                    {submission.ppid || '-'}
                  </div>
                </div>
                {/* 상신자 */}
                <div>
                  <label className="text-xs font-medium text-gray-600">상신자</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs px-1 py-0">{submission.submitted_by}</Badge>
                  </div>
                </div>
                {/* 상태 */}
                <div>
                  <label className="text-xs font-medium text-gray-600">상태</label>
                  <div className="mt-1">
                    <Badge 
                      variant={
                        submission.status === '완료' ? 'default' :
                        submission.status === '진행중' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs px-1 py-0"
                    >
                      {submission.status || '대기중'}
                    </Badge>
                  </div>
                </div>
                {/* 부서 */}
                <div>
                  <label className="text-xs font-medium text-gray-600">부서</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs px-1 py-0">{submission.department}</Badge>
                  </div>
                </div>
                {/* 상신일시 */}
                <div>
                  <label className="text-xs font-medium text-gray-600">상신일시</label>
                  <div className="mt-1 p-1 bg-gray-50 rounded text-xs">
                    {formatDate(submission.submitted_at)}
                  </div>
                </div>
                {/* 담당자 */}
                <div>
                  <label className="text-xs font-medium text-gray-600">담당자</label>
                  <div className="mt-1">
                    {submission.assignee ? (
                      <Badge variant="secondary" className="text-xs px-1 py-0">{submission.assignee}</Badge>
                    ) : (
                      <span className="text-gray-500 text-xs">미지정</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 두 번째 줄: 변경의뢰 항목 */}
              <div>
                <label className="text-xs font-medium text-gray-600">변경의뢰 항목</label>
                <div className="mt-1 p-1.5 bg-gray-50 rounded text-xs">
                  {submission.change_request_items || '-'}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">Max TAT</label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={maxTatInput}
                    onChange={(event) => setMaxTatInput(event.target.value)}
                    className="h-8 w-32 text-sm"
                    placeholder="미입력"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleMaxTatSave}
                    disabled={!isMaxTatValid || !isMaxTatDirty || updateMaxTatMutation.isPending}
                  >
                    {updateMaxTatMutation.isPending ? "저장 중..." : "저장"}
                  </Button>
                  <span className="text-xs text-gray-500">일</span>
                </div>
                {!isMaxTatValid && (
                  <p className="mt-1 text-[11px] text-red-500">숫자만 입력할 수 있습니다.</p>
                )}
              </div>

              {/* 제목 */}
              <div>
                <label className="text-xs font-medium text-gray-600">제목</label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  {submission.title}
                </div>
              </div>

              {/* 상세 내용 - 스크롤 가능한 영역으로 변경 */}
              <div>
                <label className="text-xs font-medium text-gray-600">상세 내용</label>
                <div className="mt-1 border rounded bg-white">
                  <ScrollArea className="max-h-40 p-2">
                    <div 
                      className="text-sm whitespace-pre-wrap overflow-auto"
                      dangerouslySetInnerHTML={{ 
                        __html: submission.content || '내용이 없습니다.' 
                      }} 
                    />
                  </ScrollArea>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="border-t p-3 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end items-center">
            {/* 삭제 버튼 - 현재 사용자와 의뢰자가 일치할 때만 표시 */}
            {user && submission.submitted_by === user.username && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  if (confirm('정말로 이 의뢰를 삭제하시겠습니까? 삭제된 의뢰는 복구할 수 없습니다.')) {
                    deleteSubmissionMutation.mutate(submission.id);
                  }
                }}
                disabled={deleteSubmissionMutation.isPending}
                className="gap-1"
              >
                <Trash2 className="h-3 w-3" />
                {deleteSubmissionMutation.isPending ? '삭제 중...' : '삭제'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}