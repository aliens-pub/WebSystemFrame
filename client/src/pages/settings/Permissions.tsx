import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, Save } from "lucide-react";

export default function Permissions() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </div>
  );
}