import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Employee {
  id: number;
  username: string;
  role: 'ENGINEER' | 'MANAGER';
  created_at: string;
  updated_at: string;
}

export default function Menu3() {
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          직원 데이터를 불러오는 중...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">직원 관리</h1>
          <p className="text-gray-600 text-sm mt-1">
            전체 직원 정보를 조회할 수 있습니다.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

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
    </main>
  );
}
