import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, Hash, Save } from "lucide-react";
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

interface ApprovalRole {
  id: number;
  name: string;
  emp_id: string;
  role: string;
  department: string;
  created_at: string;
  updated_at: string;
}

const APPROVAL_ROLES = ['결재', '병렬결재', '합의', '병렬합의', '통보'] as const;

export default function ApprovalPaths() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
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

  // 선택된 부서의 기존 결재 역할 조회
  const { data: existingRoles } = useQuery<ApprovalRole[]>({
    queryKey: ["/api/approval-roles", selectedDepartment],
    queryFn: async () => {
      if (!selectedDepartment) return [];
      const response = await fetch(`/api/approval-roles?department=${encodeURIComponent(selectedDepartment)}`);
      if (!response.ok) {
        throw new Error("결재 역할 정보를 불러오는데 실패했습니다.");
      }
      return response.json();
    },
    enabled: !!selectedDepartment,
  });

  // 결재 역할 저장 mutation
  const saveRolesMutation = useMutation({
    mutationFn: async (data: { department: string; roles: Record<string, string> }) => {
      const response = await fetch("/api/approval-roles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("결재 역할 저장에 실패했습니다.");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "저장 완료",
        description: "결재 역할이 성공적으로 저장되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/approval-roles", selectedDepartment] });
    },
    onError: (error) => {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 부서별 직원 수 계산
  const departmentStats =
    empInfos?.reduce(
      (acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  // 선택된 부서의 직원들 필터링
  const filteredEmployees = selectedDepartment
    ? empInfos?.filter((emp) => emp.department === selectedDepartment) || []
    : [];

  // 기존 역할을 employeeRoles 상태에 반영
  React.useEffect(() => {
    if (existingRoles && selectedDepartment) {
      const roles: Record<string, string> = {};
      existingRoles.forEach((role) => {
        roles[role.emp_id] = role.role;
      });
      setEmployeeRoles(roles);
    } else {
      setEmployeeRoles({});
    }
  }, [existingRoles, selectedDepartment]);

  // 역할 변경 핸들러
  const handleRoleChange = (empId: string, role: string) => {
    setEmployeeRoles(prev => ({
      ...prev,
      [empId]: role
    }));
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!selectedDepartment) {
      toast({
        title: "오류",
        description: "부서를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 선택된 역할만 필터링
    const selectedRoles = Object.fromEntries(
      Object.entries(employeeRoles).filter(([, role]) => role && role.trim() !== '')
    );

    console.log("=== 저장 버튼 클릭 ===");
    console.log("selectedDepartment:", selectedDepartment);
    console.log("employeeRoles:", employeeRoles);
    console.log("selectedRoles:", selectedRoles);
    console.log("selectedRoles length:", Object.keys(selectedRoles).length);

    if (Object.keys(selectedRoles).length === 0) {
      toast({
        title: "오류",
        description: "최소 한 명의 직원에게 역할을 지정해주세요.",
        variant: "destructive",
      });
      return;
    }

    console.log("Mutation 데이터:", { roles: selectedRoles });

    saveRolesMutation.mutate({
      department: selectedDepartment,
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">결재 경로 설정</h1>
          <p className="text-gray-600 text-sm mt-1">
            부서별로 결재 경로를 설정할 수 있습니다.
          </p>
        </div>
        {selectedDepartment && (
          <Button 
            onClick={handleSave}
            disabled={saveRolesMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveRolesMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽 박스 - 부서 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              부서 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(departmentStats).map(([department, count]) => (
                  <Button
                    key={department}
                    variant={
                      selectedDepartment === department ? "default" : "outline"
                    }
                    className="w-full justify-between h-12"
                    onClick={() => setSelectedDepartment(department)}
                  >
                    <span className="font-medium">{department}</span>
                    <Badge variant="secondary">{count}명</Badge>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 오른쪽 박스 - 선택된 부서의 직원 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              {selectedDepartment
                ? `${selectedDepartment}  멤버 목록`
                : "멤버 목록"}
              {selectedDepartment && (
                <Badge variant="secondary" className="ml-2">
                  {filteredEmployees.length}명
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !selectedDepartment ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  왼쪽에서 부서를 선택하면 해당 부서의 직원 목록이 표시됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmployees.map((emp) => (
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
