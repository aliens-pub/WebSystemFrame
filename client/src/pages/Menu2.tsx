import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, FileText, Users, Check, ChevronsUpDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CKEditor5Component } from "@/components/CKEditor5Component";

interface EmpInfo {
  id: number;
  name: string;
  department: string;
  emp_id: string;
  created_at: string;
  updated_at: string;
}

interface EmailTemplate {
  id: number;
  department: string;
  subject: string;
  content: string;
  auto_send: boolean;
  require_approval: boolean;
  cc_manager: boolean;
  created_at: string;
  updated_at: string;
}

export default function Menu2() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [selectedPpid, setSelectedPpid] = useState<string>("");
  const [selectedEqpid, setSelectedEqpid] = useState<string>("");
  const [selectedChangeRequestItem, setSelectedChangeRequestItem] = useState<string>("");
  const [requestTitle, setRequestTitle] = useState<string>("");
  const [requestContent, setRequestContent] = useState<string>("");
  const [open, setOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  // 드롭다운 옵션들
  const lineIdOptions = Array.from({ length: 10 }, (_, i) => `LINE-${String(i + 1).padStart(3, '0')}`);
  const ppidOptions = Array.from({ length: 5 }, (_, i) => `PP-${String(i + 1).padStart(3, '0')}`);
  const eqpidOptions = Array.from({ length: 8 }, (_, i) => `EQP-${String(i + 1).padStart(3, '0')}`);
  const changeRequestItemOptions = [
    '설정값 변경',
    '프로세스 파라미터 조정',
    '레시피 수정',
    '알람 임계값 변경',
    '운전 조건 변경',
    '유지보수 스케줄 조정',
    '센서 캘리브레이션',
    '소프트웨어 업데이트'
  ];

  // 부서 목록 조회 (기존 직원 정보에서 부서 추출)
  const { data: empInfos, isLoading: isDepartmentLoading, error } = useQuery<EmpInfo[]>({
    queryKey: ['/api/emp-info'],
    queryFn: async () => {
      const response = await fetch('/api/emp-info', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('부서 정보를 불러오는데 실패했습니다.');
      }
      return response.json();
    },
  });

  // 선택된 부서의 이메일 템플릿 조회
  const { data: emailTemplate, isLoading: isTemplateLoading } = useQuery<EmailTemplate>({
    queryKey: ['/api/email-templates', selectedDepartment],
    queryFn: async () => {
      const response = await fetch(`/api/email-templates/${encodeURIComponent(selectedDepartment)}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('템플릿을 불러오는데 실패했습니다.');
      }
      return response.json();
    },
    enabled: !!selectedDepartment,
  });

  // 의뢰 상신 mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (requestData: {
      department: string;
      title: string;
      content: string;
      submitted_by: string;
      line_id: string;
      ppid: string;
      eqpid: string;
      change_request_items: string;
    }) => {
      try {
        const response = await fetch('/api/request-submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 세션 쿠키 포함
          body: JSON.stringify(requestData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`의뢰 상신에 실패했습니다. (${response.status}): ${errorText}`);
        }
        
        return response.json();
      } catch (err) {
        console.error('Submit request failed:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "상신 완료",
        description: `${selectedDepartment}에 의뢰가 성공적으로 상신되었습니다.`,
      });
      // 폼 초기화
      setRequestTitle("");
      setRequestContent("");
      setSelectedDepartment("");
      setSelectedLineId("");
      setSelectedPpid("");
      setSelectedEqpid("");
      setSelectedChangeRequestItem("");
    },
    onError: (error) => {
      toast({
        title: "상신 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 부서 목록 추출
  const departments = empInfos
    ? Array.from(new Set(empInfos.map(emp => emp.department))).sort()
    : [];

  // 템플릿 로드 시 내용 설정
  useEffect(() => {
    if (emailTemplate && emailTemplate.content) {
      setRequestContent(emailTemplate.content);
    } else if (selectedDepartment) {
      // 기본 템플릿을 HTML 형식으로 설정
      const defaultTemplate = `<p>안녕하세요, <strong>${selectedDepartment}</strong>입니다.</p><p>아래와 같이 업무를 의뢰드립니다.</p><p><br></p><p><strong>■ 의뢰 내용:</strong></p><p><br></p><p><strong>■ 요청 기한:</strong></p><p><br></p><p><strong>■ 우선순위:</strong></p><p><br></p><p><strong>■ 참고사항:</strong></p><p><br></p><p>감사합니다.</p>`;
      setRequestContent(defaultTemplate);
    }
  }, [emailTemplate, selectedDepartment]);

  // 4개 드롭다운 선택 시 자동 제목 생성
  useEffect(() => {
    if (selectedLineId && selectedPpid && selectedEqpid && selectedChangeRequestItem) {
      const autoTitle = `[${selectedLineId}_${selectedPpid}_${selectedEqpid}_${selectedChangeRequestItem}]`;
      setRequestTitle(autoTitle);
    }
  }, [selectedLineId, selectedPpid, selectedEqpid, selectedChangeRequestItem]);

  // HTML에서 텍스트 내용만 추출하는 함수
  const getTextFromHtml = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // 의뢰 상신 처리
  const handleSubmitRequest = () => {
    if (!selectedDepartment) {
      toast({
        title: "부서 선택 필요",
        description: "의뢰할 부서를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLineId) {
      toast({
        title: "Line ID 선택 필요",
        description: "Line ID를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPpid) {
      toast({
        title: "PPID 선택 필요",
        description: "PPID를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedEqpid) {
      toast({
        title: "EQPID 선택 필요",
        description: "EQPID를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedChangeRequestItem) {
      toast({
        title: "변경 의뢰 항목 선택 필요",
        description: "변경 의뢰 항목을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!requestTitle.trim()) {
      toast({
        title: "제목 입력 필요",
        description: "의뢰 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!getTextFromHtml(requestContent).trim()) {
      toast({
        title: "내용 입력 필요",
        description: "의뢰 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated || !user) {
      toast({
        title: "로그인 필요",
        description: "로그인 후 이용해주세요.",
        variant: "destructive",
      });
      return;
    }

    submitRequestMutation.mutate({
      department: selectedDepartment,
      title: requestTitle,
      content: requestContent,
      submitted_by: user.username,
      line_id: selectedLineId,
      ppid: selectedPpid,
      eqpid: selectedEqpid,
      change_request_items: selectedChangeRequestItem,
    });
  };

  // Remove error blocking - let the fallback data handle failures

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">의뢰 상신</h1>
        <p className="text-gray-600 text-sm mt-1">
          부서별 의뢰 양식을 사용하여 업무를 상신할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              의뢰 상신 작성
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 부서 선택 */}
            <div>
              <Label htmlFor="department-select">의뢰 부서</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-2/5 justify-between"
                  >
                    {selectedDepartment
                      ? departments.find((department) => department === selectedDepartment)
                      : "의뢰할 부서를 검색하거나 선택하세요"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="부서명 검색..." />
                    <CommandEmpty>해당하는 부서가 없습니다.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-hidden relative">
                      {isDepartmentLoading ? (
                        <div className="p-2 text-center text-sm text-gray-500">
                          부서 목록을 불러오는 중...
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          {departments.map((department, index) => (
                            <CommandItem
                              key={department}
                              value={department}
                              onSelect={(currentValue) => {
                                setSelectedDepartment(currentValue === selectedDepartment ? "" : currentValue);
                                setOpen(false);
                              }}
                              className={`${
                                index >= 9 ? 'opacity-60' : ''
                              } ${
                                index >= 10 ? 'opacity-30' : ''
                              }`}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedDepartment === department ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {department}
                            </CommandItem>
                          ))}
                        </div>
                      )}
                      {/* Scroll hint gradient overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* 4개 드롭다운 선택 영역 */}
            {selectedDepartment && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="line-id">Line ID</Label>
                  <Select value={selectedLineId} onValueChange={setSelectedLineId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Line ID 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {lineIdOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ppid">PPID</Label>
                  <Select value={selectedPpid} onValueChange={setSelectedPpid}>
                    <SelectTrigger>
                      <SelectValue placeholder="PPID 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {ppidOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eqpid">EQPID</Label>
                  <Select value={selectedEqpid} onValueChange={setSelectedEqpid}>
                    <SelectTrigger>
                      <SelectValue placeholder="EQPID 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {eqpidOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="change-request-item">변경 의뢰 항목</Label>
                  <Select value={selectedChangeRequestItem} onValueChange={setSelectedChangeRequestItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="변경 의뢰 항목 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {changeRequestItemOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* 의뢰 제목 */}
            {selectedDepartment && (
              <div>
                <Label htmlFor="request-title">의뢰 제목</Label>
                <input
                  id="request-title"
                  type="text"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="의뢰 제목을 입력하세요"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}

            {/* 의뢰 내용 */}
            {selectedDepartment && (
              <div>
                <Label htmlFor="request-content">의뢰 내용</Label>
                {isTemplateLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <CKEditor5Component
                    content={requestContent}
                    onChange={setRequestContent}
                    placeholder="의뢰 내용을 입력하세요. 이미지를 복사해서 붙여넣기하거나 Excel 표를 붙여넣기할 수 있습니다."
                  />
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {emailTemplate
                    ? `${selectedDepartment}의 저장된 템플릿을 불러왔습니다. 필요에 따라 수정하세요.`
                    : `${selectedDepartment}의 기본 템플릿을 사용합니다. 내용을 수정하여 의뢰서를 작성하세요.`
                  }
                  <br />
                  <span className="text-blue-600">
                    고급 리치 텍스트 에디터: 볼드, 이탤릭, 목록, 링크를 지원하며, 이미지나 Excel 표를 직접 붙여넣기할 수 있습니다. 
                    붙여넣어진 표는 모든 셀을 편집할 수 있고, 행/열 추가/삭제가 가능합니다. 
                    툴바의 표 버튼을 사용해 새로운 표를 생성할 수도 있습니다.
                  </span>
                </p>
              </div>
            )}

            {/* 상신자 정보 */}
            {isAuthenticated && user && (
              <div>
                <Label>상신자</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="font-medium">{user.username}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 상신 버튼 */}
            {selectedDepartment && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitRequest}
                  disabled={
                    submitRequestMutation.isPending ||
                    !selectedLineId ||
                    !selectedPpid ||
                    !selectedEqpid ||
                    !selectedChangeRequestItem ||
                    !requestTitle.trim() ||
                    !getTextFromHtml(requestContent).trim()
                  }
                  className="min-w-[120px]"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitRequestMutation.isPending ? "상신 중..." : "상신"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}