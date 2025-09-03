import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Save, Settings, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface CommonTemplate {
  id: number;
  subject: string;
  content: string;
  auto_send: boolean;
  require_approval: boolean;
  cc_manager: boolean;
  created_at: string;
  updated_at: string;
}

export default function RequestForms() {
  const [emailTemplate, setEmailTemplate] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 공통 이메일 템플릿 조회
  const { data: currentTemplate, isLoading: isTemplateLoading } = useQuery<CommonTemplate>({
    queryKey: ['/api/common-email-template'],
    queryFn: async () => {
      const response = await fetch('/api/common-email-template');
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('공통 템플릿을 불러오는데 실패했습니다.');
      }
      return response.json();
    },
  });

  // 공통 이메일 템플릿 저장 mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: {
      subject: string;
      content: string;
    }) => {
      const response = await fetch('/api/common-email-template', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        throw new Error('공통 템플릿 저장에 실패했습니다.');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "저장 완료",
        description: "공통 의뢰 양식이 성공적으로 저장되었습니다.",
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/common-email-template'],
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

  // 기본 공통 템플릿 생성 함수
  const getDefaultEmailTemplate = () => {
    return {
      subject: '[업무 의뢰서] 의뢰 제목',
      content: `안녕하세요.

아래와 같이 업무를 의뢰드립니다.

■ 의뢰 내용: 
■ 요청 기한: 
■ 우선순위: 
■ 참고사항: 

감사합니다.`
    };
  };

  // 현재 템플릿 데이터가 변경될 때 폼 상태 업데이트
  useEffect(() => {
    if (currentTemplate) {
      setEmailSubject(currentTemplate.subject);
      setEmailTemplate(currentTemplate.content);
    } else {
      // 새로운 템플릿의 경우 기본값 설정
      const defaultTemplate = getDefaultEmailTemplate();
      setEmailSubject(defaultTemplate.subject);
      setEmailTemplate(defaultTemplate.content);
    }
  }, [currentTemplate]);

  // 템플릿 저장 핸들러
  const handleSaveTemplate = () => {
    saveTemplateMutation.mutate({
      subject: emailSubject,
      content: emailTemplate,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">공통 의뢰 양식 설정</h2>
          <p className="text-gray-600">모든 부서에서 공통으로 사용할 의뢰 양식과 이메일 템플릿을 설정합니다.</p>
        </div>
        
        {/* 공통 메일 양식 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              공통 의뢰 양식
              <Badge variant="secondary" className="ml-2">
                전체 적용
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTemplateLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="email-subject">이메일 제목 템플릿</Label>
                  <Input 
                    id="email-subject" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="이메일 제목 템플릿을 입력하세요"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    실제 의뢰서에서는 사용자가 입력한 제목이 사용됩니다.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="email-template">의뢰 양식 템플릿</Label>
                  <Textarea 
                    id="email-template" 
                    value={emailTemplate}
                    onChange={(e) => setEmailTemplate(e.target.value)}
                    placeholder="의뢰 양식 템플릿을 입력하세요"
                    className="min-h-[400px]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    이 템플릿이 모든 부서의 기본 의뢰 양식으로 사용됩니다.
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-2">공통 템플릿 적용 안내</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 이 설정은 모든 부서의 의뢰서에 공통으로 적용됩니다</li>
                        <li>• 사용자는 이 템플릿을 기반으로 의뢰서를 작성할 수 있습니다</li>
                        <li>• 고급 텍스트 에디터를 통해 서식, 이미지, 표 등을 추가할 수 있습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleSaveTemplate}
                  disabled={saveTemplateMutation.isPending}
                  size="lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveTemplateMutation.isPending 
                    ? "저장 중..." 
                    : "공통 의뢰 양식 저장"
                  }
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}