import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Save, Building2, Users, Search, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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

export default function RequestForms() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [emailTemplate, setEmailTemplate] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [autoSend, setAutoSend] = useState<boolean>(false);
  const [requireApproval, setRequireApproval] = useState<boolean>(false);
  const [ccManager, setCcManager] = useState<boolean>(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: empInfos, isLoading, error } = useQuery<EmpInfo[]>({
    queryKey: ['/api/emp-info'],
    queryFn: async () => {
      const response = await fetch('/api/emp-info');
      if (!response.ok) {
        throw new Error('직원 정보를 불러오는데 실패했습니다.');
      }
      return response.json();
    },
  });

  // 특정 부서의 이메일 템플릿 조회
  const { data: currentTemplate, isLoading: isTemplateLoading } = useQuery<EmailTemplate>({
    queryKey: ['/api/email-templates', selectedDepartment],
    queryFn: async () => {
      const response = await fetch(`/api/email-templates/${selectedDepartment}`);
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

  // 이메일 템플릿 저장 mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: {
      department: string;
      subject: string;
      content: string;
      auto_send: boolean;
      require_approval: boolean;
      cc_manager: boolean;
    }) => {
      const response = await fetch(`/api/email-templates/${templateData.department}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        throw new Error('템플릿 저장에 실패했습니다.');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "저장 완료",
        description: `${selectedDepartment} 템플릿이 성공적으로 저장되었습니다.`,
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/email-templates', selectedDepartment],
      });
    },
    onError: (error) => {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 부서별 직원 수 계산
  const departmentStats = empInfos?.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // 검색 키워드로 부서 목록 필터링
  const filteredDepartments = Object.keys(departmentStats).filter(department =>
    department.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  // 기본 템플릿 생성 함수
  const getDefaultEmailTemplate = (department: string) => {
    return {
      subject: `[${department}] 업무 의뢰서`,
      content: `안녕하세요, ${department}입니다.

아래와 같이 업무를 의뢰드립니다.

■ 의뢰 내용: 
■ 요청 기한: 
■ 우선순위: 
■ 참고사항: 

감사합니다.`
    };
  };

  // 부서 선택 시 템플릿 로드
  const handleDepartmentSelect = (department: string) => {
    setSelectedDepartment(department);
  };

  // 현재 템플릿 데이터가 변경될 때 폼 상태 업데이트
  useEffect(() => {
    if (currentTemplate) {
      setEmailSubject(currentTemplate.subject);
      setEmailTemplate(currentTemplate.content);
      setAutoSend(currentTemplate.auto_send);
      setRequireApproval(currentTemplate.require_approval);
      setCcManager(currentTemplate.cc_manager);
    } else if (selectedDepartment) {
      // 새로운 템플릿의 경우 기본값 설정
      const defaultTemplate = getDefaultEmailTemplate(selectedDepartment);
      setEmailSubject(defaultTemplate.subject);
      setEmailTemplate(defaultTemplate.content);
      setAutoSend(false);
      setRequireApproval(false);
      setCcManager(false);
    }
  }, [currentTemplate, selectedDepartment]);

  // 템플릿 저장 핸들러
  const handleSaveTemplate = () => {
    if (!selectedDepartment) return;
    
    saveTemplateMutation.mutate({
      department: selectedDepartment,
      subject: emailSubject,
      content: emailTemplate,
      auto_send: autoSend,
      require_approval: requireApproval,
      cc_manager: ccManager,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">의뢰 양식 설정</h2>
          <p className="text-gray-600">부서별 의뢰 양식과 이메일 템플릿을 설정합니다.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 부서 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                부서 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 검색창 */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="부서명을 검색하세요..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">부서 정보를 불러오는 중 오류가 발생했습니다.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredDepartments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">검색 결과가 없습니다.</p>
                    </div>
                  ) : (
                    filteredDepartments.map((department) => (
                      <Button
                        key={department}
                        variant={selectedDepartment === department ? "default" : "outline"}
                        className="w-full justify-between h-auto py-3"
                        onClick={() => handleDepartmentSelect(department)}
                      >
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4" />
                          <span className="font-medium">{department}</span>
                        </div>
                        <Badge variant="secondary" className="flex items-center">
                          <Users className="mr-1 h-3 w-3" />
                          {departmentStats[department]}명
                        </Badge>
                      </Button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 부서별 메일 양식 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                부서별 메일 양식
                {selectedDepartment && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedDepartment}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedDepartment ? (
                <div className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    왼쪽에서 부서를 선택하면<br />
                    해당 부서의 메일 양식을 설정할 수 있습니다.
                  </p>
                </div>
              ) : (
                <>
                  {isTemplateLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="email-subject">이메일 제목</Label>
                        <Input 
                          id="email-subject" 
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="이메일 제목을 입력하세요"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email-template">이메일 템플릿</Label>
                        <Textarea 
                          id="email-template" 
                          value={emailTemplate}
                          onChange={(e) => setEmailTemplate(e.target.value)}
                          placeholder="이메일 템플릿을 입력하세요"
                          className="min-h-[300px]"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label>템플릿 설정</Label>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="auto-send" 
                            checked={autoSend}
                            onCheckedChange={setAutoSend}
                          />
                          <Label htmlFor="auto-send">자동 발송</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="require-approval" 
                            checked={requireApproval}
                            onCheckedChange={setRequireApproval}
                          />
                          <Label htmlFor="require-approval">승인 필요</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="cc-manager" 
                            checked={ccManager}
                            onCheckedChange={setCcManager}
                          />
                          <Label htmlFor="cc-manager">매니저 참조</Label>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleSaveTemplate}
                        disabled={saveTemplateMutation.isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {saveTemplateMutation.isPending 
                          ? "저장 중..." 
                          : `${selectedDepartment} 템플릿 저장`
                        }
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}