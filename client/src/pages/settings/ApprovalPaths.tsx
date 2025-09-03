import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Settings, Users, Hash, Save, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as React from "react";
import { useToast } from "@/hooks/use-toast";

interface EmpInfo {
  id: number;
  name: string;
  department: string;
  emp_id: string;
  created_at: string;
  updated_at: string;
}

interface CommonApprovalRole {
  id: number;
  name: string;
  emp_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const APPROVAL_ROLES = ['결재', '병렬결재', '합의', '병렬합의', '통보'] as const;

export default function ApprovalPaths() {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [employeeRoles, setEmployeeRoles] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: empInfos,
    isLoading,
    error,
  } = useQuery<EmpInfo[]>({
    queryKey: ["/api/emp-info"],
    queryFn: async () => {
      const response = await fetch("/api/emp-info");
      if (!response.ok) {
        throw new Error("직원 정보를 불러오는데 실패했습니다.");
      }
      return response.json();
    },
  });

  // 공통 결재 역할 조회
  const { data: existingRoles } = useQuery<CommonApprovalRole[]>({
    queryKey: ["/api/common-approval-roles"],
    queryFn: async () => {
      const response = await fetch('/api/common-approval-roles');
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error("공통 결재 역할 정보를 불러오는데 실패했습니다.");
      }
      return response.json();
    },
  });

  // 공통 결재 역할 저장 mutation
  const saveRolesMutation = useMutation({
    mutationFn: async (data: { roles: Record<string, string> }) => {
      const response = await fetch("/api/common-approval-roles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("공통 결재 역할 저장에 실패했습니다.");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "저장 완료",
        description: "공통 결재 경로가 성공적으로 저장되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/common-approval-roles"] });
    },
    onError: (error) => {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 검색 키워드로 직원 목록 필터링
  const filteredEmployees = empInfos?.filter((emp) =>
    emp.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    emp.emp_id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchKeyword.toLowerCase())
  ) || [];

  // 기존 역할을 employeeRoles 상태에 반영
  React.useEffect(() => {
    if (existingRoles) {
      const roles: Record<string, string> = {};
      existingRoles.forEach((role) => {
        roles[role.emp_id] = role.role;
      });
      setEmployeeRoles(roles);
    } else {
      setEmployeeRoles({});
    }
  }, [existingRoles]);

  // 역할 변경 핸들러
  const handleRoleChange = (empId: string, role: string) => {
    setEmployeeRoles(prev => ({
      ...prev,
      [empId]: role
    }));
  };

  // 저장 핸들러
  const handleSave = () => {
    // 선택된 역할만 필터링
    const selectedRoles = Object.fromEntries(
      Object.entries(employeeRoles).filter(([, role]) => role && role.trim() !== '')
    );

    if (Object.keys(selectedRoles).length === 0) {
      toast({
        title: "오류",
        description: "최소 한 명의 직원에게 역할을 지정해주세요.",
        variant: "destructive",
      });
      return;
    }

    saveRolesMutation.mutate({
      roles: selectedRoles
    });
  };

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            결재 경로 설정
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            부서별로 결재 경로를 설정할 수 있습니다.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-red-600">
                데이터를 불러오는 중 오류가 발생했습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">공통 결재 경로 설정</h1>
          <p className="text-gray-600 text-sm mt-1">
            모든 부서에서 공통으로 사용할 결재 경로를 설정합니다.
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saveRolesMutation.isPending}
          className="flex items-center gap-2"
          size="lg"
        >
          <Save className="h-4 w-4" />
          {saveRolesMutation.isPending ? "저장 중..." : "공통 결재 경로 저장"}
        </Button>
      </div>

      {/* 공통 결재 경로 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            공통 결재자 설정
            <Badge variant="secondary" className="ml-2">
              전체 적용
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 검색창 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="직원명, 사번, 부서명으로 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Settings className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-2">공통 결재 경로 안내</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 여기서 설정한 결재자들이 모든 의뢰서의 결재 경로로 사용됩니다</li>
                      <li>• 부서에 관계없이 동일한 결재 절차가 적용됩니다</li>
                      <li>• 결재 → 병렬결재 → 합의 → 병렬합의 → 통보 순으로 역할을 설정하세요</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      {searchKeyword ? "검색 결과가 없습니다." : "직원 정보가 없습니다."}
                    </p>
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {emp.name}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Hash className="h-3 w-3 mr-1" />
                            {emp.emp_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          value={employeeRoles[emp.emp_id] || ""}
                          onValueChange={(value) => handleRoleChange(emp.emp_id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="역할 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {APPROVAL_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Badge variant="outline">{emp.department}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
