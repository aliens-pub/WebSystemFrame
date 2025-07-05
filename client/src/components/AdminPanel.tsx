import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UserRoundCheck, Shield, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "권한 변경 완료",
        description: "사용자 권한이 성공적으로 변경되었습니다.",
      });
      setSelectedUserId(null);
      setSelectedRole("");
    },
    onError: (error: any) => {
      toast({
        title: "권한 변경 실패",
        description: error.message || "권한 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateRole = () => {
    if (selectedUserId && selectedRole) {
      updateRoleMutation.mutate({ userId: selectedUserId, role: selectedRole });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            사용자 권한 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>MANAGER</strong>: 모든 메뉴 접근 권한 |{" "}
              <strong>ENGINEER</strong>: 메뉴4 접근 제한
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자명</TableHead>
                  <TableHead>현재 권한</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>권한 변경</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <UserRoundCheck className="mr-2 h-4 w-4 text-gray-500" />
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "MANAGER" ? "default" : "secondary"}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={selectedUserId === user.id ? selectedRole : ""}
                          onValueChange={(value) => {
                            setSelectedUserId(user.id);
                            setSelectedRole(value);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="권한 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANAGER">MANAGER</SelectItem>
                            <SelectItem value="ENGINEER">ENGINEER</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={handleUpdateRole}
                          disabled={
                            selectedUserId !== user.id ||
                            !selectedRole ||
                            updateRoleMutation.isPending
                          }
                        >
                          변경
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
