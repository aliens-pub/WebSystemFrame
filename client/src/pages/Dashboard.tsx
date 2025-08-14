import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, AlertTriangle, Pause, BarChart3 } from "lucide-react";
import { RequestSubmission } from "@shared/schema";

interface ApiResponse {
  results: RequestSubmission[];
  count: number;
}

export default function Dashboard() {
  const { data: submissionsData, isLoading } = useQuery<ApiResponse>({
    queryKey: ['/api/request-submissions'],
    queryFn: async () => {
      const response = await fetch('/api/request-submissions?page=1&page_size=1000', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      return response.json();
    },
  });

  // 상태별 통계 계산
  const statusStats = submissionsData?.results.reduce((acc, submission) => {
    const status = submission.status || '대기중';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const statusConfig = [
    {
      key: '대기중',
      label: '대기중',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50/80',
      borderColor: 'border-yellow-200/30',
    },
    {
      key: '진행중',
      label: '진행중',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/80',
      borderColor: 'border-blue-200/30',
    },
    {
      key: '완료',
      label: '완료',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50/80',
      borderColor: 'border-green-200/30',
    },
    {
      key: '보류',
      label: '보류',
      icon: Pause,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50/80',
      borderColor: 'border-gray-200/30',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23C7A2FE%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">의뢰 상신 대시보드</h1>
          <p className="text-gray-600">전체 의뢰 상신 현황을 한눈에 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statusConfig.map((config) => {
            const Icon = config.icon;
            const count = statusStats[config.key] || 0;

            return (
              <Card 
                key={config.key} 
                className={`
                  backdrop-blur-lg bg-white/30 border border-white/20 shadow-lg
                  hover:shadow-xl transition-all duration-300 hover:scale-105
                  ${config.bgColor} ${config.borderColor}
                `}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {config.label}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-16 bg-white/40" />
                      <Skeleton className="h-4 w-20 bg-white/30" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {count}
                      </div>
                      <p className="text-xs text-gray-600">
                        전체 {submissionsData?.count || 0}건 중
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 추가 통계 카드 */}
        <div className="mt-8">
          <Card className="backdrop-blur-lg bg-white/30 border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                요약 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <Skeleton className="h-6 w-full mb-2 bg-white/40" />
                      <Skeleton className="h-4 w-16 mx-auto bg-white/30" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {submissionsData?.count || 0}
                    </div>
                    <div className="text-sm text-gray-600">전체 의뢰</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {Math.round(((statusStats['완료'] || 0) / (submissionsData?.count || 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">완료율</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {(statusStats['진행중'] || 0) + (statusStats['대기중'] || 0)}
                    </div>
                    <div className="text-sm text-gray-600">처리 중</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600">
                      {statusStats['보류'] || 0}
                    </div>
                    <div className="text-sm text-gray-600">보류</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
