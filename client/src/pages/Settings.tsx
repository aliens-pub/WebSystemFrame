import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { FileText, GitBranch, Shield, Database } from "lucide-react";

export default function Settings() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">시스템 설정</h2>
          <p className="text-gray-600">시스템 전반적인 설정을 관리합니다.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/settings/request-forms">
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
          </Link>
          
          <Link href="/settings/approval-paths">
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
          </Link>
          
          <Link href="/settings/permissions">
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
          </Link>
          
          <Link href="/settings/database-edit">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  DB 수정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Guide_DB 테이블을 엑셀처럼 편집합니다.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}