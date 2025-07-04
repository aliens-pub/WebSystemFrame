import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { FileText, GitBranch, Shield, Save } from "lucide-react";

export default function Settings() {
  const [location] = useLocation();
  
  const renderContent = () => {
    if (location === "/settings/request-forms") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">의뢰 양식 설정</h2>
            <p className="text-gray-600">사용자가 의뢰할 때 사용할 양식을 설정합니다.</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                기본 의뢰 양식
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="form-title">양식 제목</Label>
                <Input id="form-title" placeholder="업무 의뢰서" />
              </div>
              
              <div>
                <Label htmlFor="form-description">양식 설명</Label>
                <Textarea id="form-description" placeholder="업무 의뢰 시 필요한 정보를 입력해주세요." />
              </div>
              
              <div className="space-y-3">
                <Label>필수 필드</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="require-title" />
                  <Label htmlFor="require-title">제목 필수</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="require-description" />
                  <Label htmlFor="require-description">상세 내용 필수</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="require-deadline" />
                  <Label htmlFor="require-deadline">마감일 필수</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="require-priority" />
                  <Label htmlFor="require-priority">우선순위 필수</Label>
                </div>
              </div>
              
              <Button className="w-full">
                <Save className="mr-2 h-4 w-4" />
                양식 저장
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    if (location === "/settings/approval-paths") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결재 경로 설정</h2>
            <p className="text-gray-600">의뢰 승인 절차와 경로를 설정합니다.</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitBranch className="mr-2 h-5 w-5" />
                승인 경로 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="approval-type">승인 유형</Label>
                <select id="approval-type" className="w-full p-2 border rounded-md">
                  <option value="sequential">순차 승인</option>
                  <option value="parallel">병렬 승인</option>
                  <option value="single">단일 승인</option>
                </select>
              </div>
              
              <div>
                <Label>승인자 설정</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input placeholder="1차 승인자" />
                    <Button variant="outline" size="sm">추가</Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="2차 승인자" />
                    <Button variant="outline" size="sm">추가</Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>승인 옵션</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-approve" />
                  <Label htmlFor="auto-approve">자동 승인 (24시간 후)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="email-notification" />
                  <Label htmlFor="email-notification">이메일 알림</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="escalation" />
                  <Label htmlFor="escalation">에스컬레이션</Label>
                </div>
              </div>
              
              <Button className="w-full">
                <Save className="mr-2 h-4 w-4" />
                경로 저장
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    if (location === "/settings/permissions") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">권한 설정</h2>
            <p className="text-gray-600">사용자 역할별 권한을 설정합니다.</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                역할별 권한 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">MANAGER 권한</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="manager-view-all" defaultChecked />
                    <Label htmlFor="manager-view-all">모든 의뢰 조회</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="manager-approve" defaultChecked />
                    <Label htmlFor="manager-approve">의뢰 승인/거부</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="manager-settings" defaultChecked />
                    <Label htmlFor="manager-settings">시스템 설정</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="manager-users" defaultChecked />
                    <Label htmlFor="manager-users">사용자 관리</Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-3">ENGINEER 권한</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="engineer-create" defaultChecked />
                    <Label htmlFor="engineer-create">의뢰 생성</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="engineer-view-own" defaultChecked />
                    <Label htmlFor="engineer-view-own">본인 의뢰 조회</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="engineer-edit-own" defaultChecked />
                    <Label htmlFor="engineer-edit-own">본인 의뢰 수정</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="engineer-comment" />
                    <Label htmlFor="engineer-comment">댓글 작성</Label>
                  </div>
                </div>
              </div>
              
              <Button className="w-full">
                <Save className="mr-2 h-4 w-4" />
                권한 저장
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // 기본 설정 페이지
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">시스템 설정</h2>
          <p className="text-gray-600">시스템 전반적인 설정을 관리합니다.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                의뢰 양식 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">사용자가 의뢰할 때 사용할 양식을 설정합니다.</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitBranch className="mr-2 h-5 w-5" />
                결재 경로 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">의뢰 승인 절차와 경로를 설정합니다.</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                권한 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">사용자 역할별 권한을 설정합니다.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderContent()}
    </div>
  );
}