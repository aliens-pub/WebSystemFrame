import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { 
  CalendarIcon, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Check,
  X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface RequestSubmission {
  id: number;
  department: string;
  title: string;
  content: string;
  submitted_by: string;
  submitted_at: string;
  line_id?: string;
  ppid?: string;
  eqpid?: string;
  change_request_items?: string;
  status?: string;
  assignee?: string;
}

interface RequestSubmissionResponse {
  results: RequestSubmission[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface EmpInfo {
  emp_id: string;
  name: string;
  department: string;
  position: string;
  email: string;
}

interface ColumnFilter {
  column: string;
  values: string[];
  sortOrder?: 'asc' | 'desc';
}

interface FilterState {
  searchTerm: string;
  dateFilter: {
    from: Date | undefined;
    to: Date | undefined;
  };
  columnFilters: ColumnFilter[];
}

// Column Header with Filter Component
function ColumnHeader({ 
  column, 
  title, 
  data, 
  onFilterChange, 
  currentFilter 
}: {
  column: string;
  title: string;
  data: string[];
  onFilterChange: (column: string, values: string[], sortOrder?: 'asc' | 'desc') => void;
  currentFilter?: ColumnFilter;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>(currentFilter?.values || []);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(currentFilter?.sortOrder);

  const uniqueValues = Array.from(new Set(data.filter(Boolean))).sort();
  const filteredValues = uniqueValues.filter(value => 
    value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApply = () => {
    onFilterChange(column, selectedValues, sortOrder);
  };

  const handleClear = () => {
    setSelectedValues([]);
    setSortOrder(undefined);
    onFilterChange(column, [], undefined);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent">
          {title}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <div className="p-2">
          <div className="flex gap-1 mb-2">
            <Button
              variant={sortOrder === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('asc')}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant={sortOrder === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('desc')}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
          
          <Input
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredValues.map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedValues.includes(value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedValues([...selectedValues, value]);
                    } else {
                      setSelectedValues(selectedValues.filter(v => v !== value));
                    }
                  }}
                />
                <span className="text-sm">{value}</span>
              </div>
            ))}
          </div>
          
          <DropdownMenuSeparator />
          
          <div className="flex gap-1 mt-2">
            <Button size="sm" onClick={handleApply}>적용</Button>
            <Button size="sm" variant="outline" onClick={handleClear}>취소</Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Assignee Cell Component
function AssigneeCell({ 
  submission, 
  onAssigneeChange 
}: { 
  submission: RequestSubmission;
  onAssigneeChange: (id: number, assignee: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(submission.assignee || "");

  const { data: empInfoData } = useQuery<EmpInfo[]>({
    queryKey: ['/api/emp-info'],
  });

  const devTeamMembers = empInfoData?.filter(emp => emp.department === "개발팀") || [];

  const handleAssigneeSelect = (assignee: string) => {
    setSelectedAssignee(assignee);
    onAssigneeChange(submission.id, assignee);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-1 text-left"
        >
          {selectedAssignee || "담당자 선택"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="담당자 검색..." />
          <CommandEmpty>담당자를 찾을 수 없습니다.</CommandEmpty>
          <CommandGroup>
            {devTeamMembers.map((member) => (
              <CommandItem
                key={member.emp_id}
                value={member.name}
                onSelect={() => handleAssigneeSelect(member.name)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedAssignee === member.name ? "opacity-100" : "opacity-0"
                  )}
                />
                {member.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function Menu1() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    dateFilter: {
      from: undefined,
      to: undefined
    },
    columnFilters: []
  });

  // 의뢰 상신 목록 조회
  const { data: submissionsData, isLoading } = useQuery<RequestSubmissionResponse>({
    queryKey: ['/api/request-submissions'],
    queryFn: async () => {
      const response = await fetch('/api/request-submissions?page=1&page_size=100');
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      return response.json();
    }
  });

  // 담당자 업데이트 뮤테이션
  const updateAssigneeMutation = useMutation({
    mutationFn: async ({ id, assignee }: { id: number; assignee: string }) => {
      return await apiRequest("PATCH", `/api/request-submissions/${id}`, { assignee });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/request-submissions'] });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd", { locale: ko });
  };

  // 필터링된 데이터 계산
  const filteredData = useMemo(() => {
    if (!submissionsData?.results) return [];

    let filtered = submissionsData.results;

    // 검색 필터
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // 날짜 범위 필터
    if (filters.dateFilter.from || filters.dateFilter.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.submitted_at);
        const fromMatch = !filters.dateFilter.from || itemDate >= filters.dateFilter.from;
        const toMatch = !filters.dateFilter.to || itemDate <= filters.dateFilter.to;
        return fromMatch && toMatch;
      });
    }

    // 컬럼 필터
    filters.columnFilters.forEach(filter => {
      if (filter.values.length > 0) {
        filtered = filtered.filter(item => {
          const value = String(item[filter.column as keyof RequestSubmission] || "");
          return filter.values.includes(value);
        });
      }
    });

    // 정렬
    filters.columnFilters.forEach(filter => {
      if (filter.sortOrder) {
        filtered.sort((a, b) => {
          const aValue = String(a[filter.column as keyof RequestSubmission] || "");
          const bValue = String(b[filter.column as keyof RequestSubmission] || "");
          const comparison = aValue.localeCompare(bValue);
          return filter.sortOrder === 'asc' ? comparison : -comparison;
        });
      }
    });

    return filtered;
  }, [submissionsData?.results, filters]);

  const handleColumnFilter = (column: string, values: string[], sortOrder?: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      columnFilters: [
        ...prev.columnFilters.filter(f => f.column !== column),
        ...(values.length > 0 || sortOrder ? [{ column, values, sortOrder }] : [])
      ]
    }));
  };

  const handleAssigneeChange = (id: number, assignee: string) => {
    updateAssigneeMutation.mutate({ id, assignee });
  };

  // 컬럼별 데이터 추출
  const getColumnData = (column: keyof RequestSubmission) => {
    return submissionsData?.results.map(item => String(item[column] || "")) || [];
  };

  const getDummyData = (column: string) => {
    // 더미 데이터 생성
    switch (column) {
      case 'line_id':
        return Array.from({ length: 10 }, (_, i) => `LINE-${String(i + 1).padStart(3, '0')}`);
      case 'ppid':
        return Array.from({ length: 5 }, (_, i) => `PP-${String(i + 1).padStart(3, '0')}`);
      case 'eqpid':
        return Array.from({ length: 8 }, (_, i) => `EQP-${String(i + 1).padStart(3, '0')}`);
      case 'change_request_items':
        return [
          '설정값 변경',
          '프로세스 파라미터 조정',
          '레시피 수정',
          '알람 임계값 변경',
          '운전 조건 변경',
          '유지보수 스케줄 조정',
          '센서 캘리브레이션',
          '소프트웨어 업데이트'
        ];
      case 'status':
        return ['대기중', '진행중', '완료', '보류'];
      default:
        return [];
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">의뢰 상신 목록</h1>
        <p className="text-gray-600 text-sm mt-1">
          모든 의뢰 상신 목록을 확인할 수 있습니다.
        </p>
      </div>

      {/* 검색 및 필터 컨트롤 */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="검색..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-10"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFilter.from ? (
                filters.dateFilter.to ? (
                  `${format(filters.dateFilter.from, "yyyy-MM-dd")} ~ ${format(filters.dateFilter.to, "yyyy-MM-dd")}`
                ) : (
                  `From: ${format(filters.dateFilter.from, "yyyy-MM-dd")}`
                )
              ) : (
                "날짜 범위 선택"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="text-sm font-medium mb-2">날짜 범위 선택</div>
              <div className="text-xs text-gray-500 mb-2">
                첫 번째 클릭: 시작일 / 두 번째 클릭: 종료일
              </div>
              <div className="flex gap-2 text-xs">
                <div className="flex-1">
                  <span className="text-gray-600">시작일:</span>
                  <div className="font-mono">
                    {filters.dateFilter.from ? format(filters.dateFilter.from, "yyyy-MM-dd") : "미선택"}
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-gray-600">종료일:</span>
                  <div className="font-mono">
                    {filters.dateFilter.to ? format(filters.dateFilter.to, "yyyy-MM-dd") : "미선택"}
                  </div>
                </div>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={filters.dateFilter.from || filters.dateFilter.to}
              onSelect={(date) => {
                if (!date) return;
                
                setFilters(prev => {
                  // 첫 번째 클릭: From 날짜 설정
                  if (!prev.dateFilter.from) {
                    return {
                      ...prev,
                      dateFilter: {
                        from: date,
                        to: undefined
                      }
                    };
                  }
                  // 두 번째 클릭: To 날짜 설정
                  else if (!prev.dateFilter.to) {
                    // To 날짜가 From 날짜보다 이전이면 From과 To를 바꿔서 설정
                    if (date < prev.dateFilter.from) {
                      return {
                        ...prev,
                        dateFilter: {
                          from: date,
                          to: prev.dateFilter.from
                        }
                      };
                    } else {
                      return {
                        ...prev,
                        dateFilter: {
                          ...prev.dateFilter,
                          to: date
                        }
                      };
                    }
                  }
                  // 이미 둘 다 선택된 경우: 새로운 From 날짜로 리셋
                  else {
                    return {
                      ...prev,
                      dateFilter: {
                        from: date,
                        to: undefined
                      }
                    };
                  }
                });
              }}
              initialFocus
            />
            {(filters.dateFilter.from || filters.dateFilter.to) && (
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    dateFilter: { from: undefined, to: undefined } 
                  }))}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  날짜 필터 제거
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {submissionsData && (
          <Badge variant="secondary">
            총 {filteredData.length}건 (전체 {submissionsData.total_count}건)
          </Badge>
        )}
      </div>

      {/* 데이터 테이블 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">
                <ColumnHeader
                  column="line_id"
                  title="Line ID"
                  data={getDummyData('line_id')}
                  onFilterChange={handleColumnFilter}
                  currentFilter={filters.columnFilters.find(f => f.column === 'line_id')}
                />
              </TableHead>
              <TableHead className="w-[100px]">
                <ColumnHeader
                  column="ppid"
                  title="PPID"
                  data={getDummyData('ppid')}
                  onFilterChange={handleColumnFilter}
                  currentFilter={filters.columnFilters.find(f => f.column === 'ppid')}
                />
              </TableHead>
              <TableHead className="w-[100px]">
                <ColumnHeader
                  column="eqpid"
                  title="EQPID"
                  data={getDummyData('eqpid')}
                  onFilterChange={handleColumnFilter}
                  currentFilter={filters.columnFilters.find(f => f.column === 'eqpid')}
                />
              </TableHead>
              <TableHead className="w-[140px]">
                <ColumnHeader
                  column="change_request_items"
                  title="변경의뢰 항목"
                  data={getDummyData('change_request_items')}
                  onFilterChange={handleColumnFilter}
                  currentFilter={filters.columnFilters.find(f => f.column === 'change_request_items')}
                />
              </TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-[120px]">
                <ColumnHeader
                  column="submitted_by"
                  title="의뢰자"
                  data={getColumnData('submitted_by')}
                  onFilterChange={handleColumnFilter}
                  currentFilter={filters.columnFilters.find(f => f.column === 'submitted_by')}
                />
              </TableHead>
              <TableHead className="w-[120px]">
                <ColumnHeader
                  column="submitted_at"
                  title="의뢰날짜"
                  data={getColumnData('submitted_at').map(date => formatDate(date))}
                  onFilterChange={handleColumnFilter}
                  currentFilter={filters.columnFilters.find(f => f.column === 'submitted_at')}
                />
              </TableHead>
              <TableHead className="w-[100px]">
                <ColumnHeader
                  column="status"
                  title="Status"
                  data={getDummyData('status')}
                  onFilterChange={handleColumnFilter}
                  currentFilter={filters.columnFilters.find(f => f.column === 'status')}
                />
              </TableHead>
              <TableHead className="w-[120px]">담당자</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="text-gray-500">
                    검색 조건에 맞는 데이터가 없습니다.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((submission) => (
                <TableRow key={submission.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-xs">
                    {submission.line_id || `LINE-${String(submission.id).padStart(3, '0')}`}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {submission.ppid || `PP-${String((submission.id % 5) + 1).padStart(3, '0')}`}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {submission.eqpid || `EQP-${String((submission.id % 8) + 1).padStart(3, '0')}`}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {submission.change_request_items || getDummyData('change_request_items')[submission.id % getDummyData('change_request_items').length]}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    <span title={submission.title}>{submission.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {submission.submitted_by}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(submission.submitted_at)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        submission.status === '완료' ? 'default' :
                        submission.status === '진행중' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {submission.status || '대기중'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AssigneeCell
                      submission={submission}
                      onAssigneeChange={handleAssigneeChange}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}