import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GitBranch, Save } from "lucide-react";

export default function ApprovalPaths() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </div>
  );
}