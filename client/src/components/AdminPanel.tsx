import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { UserRoundCheck, Shield, Info } from "lucide-react";
import type { User } from "@/types/schema";

export function AdminPanel() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock users data
  const mockUsers: User[] = [
    {
      id: 1,
      username: "홍길동",
      role: "MANAGER",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: 2,
      username: "김철수",
      role: "ENGINEER",
      createdAt: new Date("2024-02-10"),
    },
    {
      id: 3,
      username: "이영희",
      role: "ENGINEER",
      createdAt: new Date("2024-03-05"),
    },
  ];

  // Load mock users on mount
  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const handleUpdateRole = () => {
    if (selectedUserId && selectedRole) {
      // Mock update role functionality
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUserId
            ? { ...user, role: selectedRole as "MANAGER" | "ENGINEER" }
            : user
        )
      );
      
      toast({
        title: "권한 변경 완료",
        description: "사용자 권한이 성공적으로 변경되었습니다.",
      });
      
      setSelectedUserId(null);
      setSelectedRole("");
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
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-2">로딩 중...</p>
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
                            isLoading
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
