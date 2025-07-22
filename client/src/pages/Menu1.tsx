import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, User, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface RequestSubmission {
  id: number;
  department: string;
  title: string;
  content: string;
  submitted_by: string;
  submitted_at: string;
}

interface RequestSubmissionResponse {
  results: RequestSubmission[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function Menu1() {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const pageSize = 10;

  // 의뢰 상신 목록 조회
  const { data: submissionsData, isLoading } = useQuery<RequestSubmissionResponse>({
    queryKey: ['/api/request-submissions', currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/request-submissions?page=${currentPage}&page_size=${pageSize}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      return response.json();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const toggleExpanded = (submissionId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">의뢰 상신 목록</h1>
        <p className="text-gray-600 text-sm mt-1">
          모든 의뢰 상신 목록을 확인할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              의뢰 상신 목록
            </div>
            {submissionsData && (
              <Badge variant="secondary">
                총 {submissionsData.total_count}건
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : submissionsData?.results.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                의뢰 상신이 없습니다
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                아직 상신된 의뢰가 없습니다. Menu2에서 새로운 의뢰를 상신해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissionsData?.results.map((submission) => {
                const isExpanded = expandedItems.has(submission.id);
                return (
                  <div key={submission.id} className="border rounded-lg hover:bg-gray-50 transition-colors">
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpanded(submission.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{submission.department}</Badge>
                          <span className="text-sm text-gray-500">#{submission.id}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="mr-1 h-4 w-4" />
                            {formatDate(submission.submitted_at)}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-1">
                        <h3 className="text-gray-900 font-medium text-base">
                          {submission.title || "제목 없음"}
                        </h3>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="mr-1 h-4 w-4" />
                        {submission.submitted_by}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {submission.content}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* 페이지네이션 */}
              {submissionsData && submissionsData.total_pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    {submissionsData.total_count}건 중 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, submissionsData.total_count)}건 표시
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {submissionsData.total_pages <= 5 ? (
                        // 5페이지 이하일 때는 모든 페이지 표시
                        Array.from({ length: submissionsData.total_pages }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })
                      ) : (
                        // 5페이지 초과일 때는 현재 페이지 근처만 표시
                        <>
                          {/* 첫 페이지 */}
                          <Button
                            variant={currentPage === 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="w-8 h-8 p-0"
                          >
                            1
                          </Button>
                          
                          {currentPage > 3 && <span className="px-2">...</span>}
                          
                          {/* 현재 페이지 근처 */}
                          {Array.from({ length: 3 }, (_, i) => {
                            const pageNum = Math.max(2, Math.min(submissionsData.total_pages - 1, currentPage - 1 + i));
                            if (pageNum === 1 || pageNum === submissionsData.total_pages) return null;
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          }).filter(Boolean)}
                          
                          {currentPage < submissionsData.total_pages - 2 && <span className="px-2">...</span>}
                          
                          {/* 마지막 페이지 */}
                          {submissionsData.total_pages > 1 && (
                            <Button
                              variant={currentPage === submissionsData.total_pages ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(submissionsData.total_pages)}
                              className="w-8 h-8 p-0"
                            >
                              {submissionsData.total_pages}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(submissionsData.total_pages, prev + 1))}
                      disabled={currentPage === submissionsData.total_pages}
                    >
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
