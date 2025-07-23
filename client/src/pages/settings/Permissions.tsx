import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Save, Users, AlertCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Employee {
  id: number;
  username: string;
  role: 'ENGINEER' | 'MANAGER';
  created_at: string;
  updated_at: string;
}

export default function Permissions() {
  const { data: employees, isLoading, error, refetch } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    retry: 3,
    retryDelay: 1000,
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'MANAGER' ? 'default' : 'secondary';
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            데이터를 불러올 수 없습니다
          </h3>
          <p className="text-gray-500 mb-4">
            직원 정보를 가져오는 중 오류가 발생했습니다.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">권한 설정</h2>
            <p className="text-gray-600">사용자 역할별 권한을 설정하고 직원 정보를 관리합니다.</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
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

        {/* 직원 관리 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              전체 직원 목록 ({employees?.length || 0}명)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employees && employees.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>사용자명</TableHead>
                      <TableHead>권한</TableHead>
                      <TableHead>생성일시</TableHead>
                      <TableHead>수정일시</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.id}</TableCell>
                        <TableCell>{employee.username}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(employee.role)}>
                            {employee.role === 'MANAGER' ? '관리자' : '엔지니어'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDateTime(employee.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDateTime(employee.updated_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  등록된 직원이 없습니다
                </h3>
                <p className="text-gray-500">
                  아직 등록된 직원 정보가 없습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}