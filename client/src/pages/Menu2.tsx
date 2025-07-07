import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, Hash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EmpInfo {
  id: number;
  name: string;
  department: string;
  emp_id: string;
  created_at: string;
  updated_at: string;
}

export default function Menu2() {
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

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">직원 정보</h1>
          <p className="text-gray-600 text-sm mt-1">
            직원들의 기본 정보를 조회할 수 있습니다.
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
          직원들의 기본 정보를 조회할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            직원 목록
            {empInfos && (
              <Badge variant="secondary" className="ml-2">
                총 {empInfos.length}명
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <div className="flex items-center">
                      <Hash className="mr-2 h-4 w-4" />
                      사번
                    </div>
                  </TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      등록일
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empInfos?.map((empInfo) => (
                  <TableRow key={empInfo.id}>
                    <TableCell className="font-mono text-sm">
                      {empInfo.emp_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {empInfo.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {empInfo.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(empInfo.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
