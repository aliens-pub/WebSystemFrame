import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building2, Users, Hash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface EmpInfo {
  id: number;
  name: string;
  department: string;
  emp_id: string;
  created_at: string;
  updated_at: string;
}

export default function Menu2() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  
  const { data: empInfos, isLoading, error } = useQuery<EmpInfo[]>({
    queryKey: ['/api/emp-info'],
    queryFn: async () => {
      const response = await fetch('/api/emp-info');
      if (!response.ok) {
        throw new Error('직원 정보를 불러오는데 실패했습니다.');
      }
      return response.json();
    },
  });

  // 부서별 직원 수 계산
  const departmentStats = empInfos?.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // 선택된 부서의 직원들 필터링
  const filteredEmployees = selectedDepartment 
    ? empInfos?.filter(emp => emp.department === selectedDepartment) || []
    : [];

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">직원 정보</h1>
          <p className="text-gray-600 text-sm mt-1">
            부서별로 직원 정보를 조회할 수 있습니다.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-red-600">데이터를 불러오는 중 오류가 발생했습니다.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">직원 정보</h1>
        <p className="text-gray-600 text-sm mt-1">
          부서별로 직원 정보를 조회할 수 있습니다.
        </p>
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
                    variant={selectedDepartment === department ? "default" : "outline"}
                    className="w-full justify-between h-12"
                    onClick={() => setSelectedDepartment(department)}
                  >
                    <span className="font-medium">{department}</span>
                    <Badge variant="secondary">
                      {count}명
                    </Badge>
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
              {selectedDepartment ? `${selectedDepartment} 직원 목록` : '직원 목록'}
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
                        <p className="font-medium text-gray-900">{emp.name}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Hash className="h-3 w-3 mr-1" />
                          {emp.emp_id}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {emp.department}
                    </Badge>
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
