import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Box, Users, Activity, Settings } from "lucide-react";

interface SystemStats {
  totalUsers: number;
  activeSessions: number;
  systemStatus: string;
}

export function MainContent() {
  const { data: stats, isLoading } = useQuery<SystemStats>({
    queryKey: ["/api/stats"],
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
        <p className="text-gray-600 text-sm mt-1">
          비즈니스 관리 시스템에 오신 것을 환영합니다
        </p>
      </div>

      {/* Content Area */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Box className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              컨텐츠 영역
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              여기에 컨텐츠를 넣어주세요. 각 메뉴를 클릭하면 해당하는 기능이 이
              영역에 표시됩니다.
            </p>
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <p className="text-sm text-slate-600">
                <Activity className="inline mr-2 h-4 w-4" />
                이 영역은 선택된 메뉴에 따라 다른 컴포넌트로 교체됩니다
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 사용자</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalUsers || 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 세션</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.activeSessions || 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">시스템 상태</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-lg font-semibold text-green-600">
                    {stats?.systemStatus || "정상"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
