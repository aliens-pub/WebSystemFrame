import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertCircle, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Employee {
  id: number;
  username: string;
  role: 'ENGINEER' | 'MANAGER';
  created_at: string;
  updated_at: string;
}

export default function Permissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roleChanges, setRoleChanges] = useState<Record<number, string>>({});
  
  const { data: employees, isLoading, error, refetch } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    retry: 3,
    retryDelay: 1000,
  });

  // 권한 업데이트 mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (updates: { employee_id: number; role: string }[]) => {
      const response = await apiRequest('PATCH', '/api/employees/update-roles', { updates });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "권한 업데이트 완료",
        description: "사용자 권한이 성공적으로 업데이트되었습니다.",
      });
      setRoleChanges({});
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error: Error) => {
      toast({
        title: "권한 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
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

  const handleRoleChange = (employeeId: number, newRole: string) => {
    setRoleChanges(prev => ({
      ...prev,
      [employeeId]: newRole
    }));
  };

  const handleSaveChanges = () => {
    const updates = Object.entries(roleChanges).map(([employeeId, role]) => ({
      employee_id: parseInt(employeeId),
      role: role
    }));

    if (updates.length === 0) {
      toast({
        title: "변경사항 없음",
        description: "저장할 변경사항이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    updatePermissionsMutation.mutate(updates);
  };

  const getCurrentRole = (employee: Employee) => {
    return roleChanges[employee.id] || employee.role;
  };

  const hasChanges = Object.keys(roleChanges).length > 0;

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
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button 
            onClick={handleSaveChanges}
            disabled={!hasChanges || updatePermissionsMutation.isPending}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {updatePermissionsMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
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
                        <div className="flex items-center space-x-2">
                          <Select
                            value={getCurrentRole(employee)}
                            onValueChange={(value) => handleRoleChange(employee.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ENGINEER">엔지니어</SelectItem>
                              <SelectItem value="MANAGER">관리자</SelectItem>
                            </SelectContent>
                          </Select>
                          {roleChanges[employee.id] && (
                            <Badge variant="outline" className="text-xs">
                              변경됨
                            </Badge>
                          )}
                        </div>
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