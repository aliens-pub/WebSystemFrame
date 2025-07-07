import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileText, Save } from "lucide-react";

export default function RequestForms() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </div>
  );
}