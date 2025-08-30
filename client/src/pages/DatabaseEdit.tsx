import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Edit, Save, X } from 'lucide-react';

interface GuideDBItem {
  id: number;
  item: string;
  standard_TAT: number;
  comment: string | null;
  reference: string | null;
  phpsi_1: string | null;
  phpsi_2: string | null;
  phpsi_3: string | null;
  phpsi_4: string | null;
  phpsi_5: string | null;
  phpsi_6: string | null;
  phpsi_7: string | null;
  phpsi_8: string | null;
  phpsi_9: string | null;
  phpsi_10: string | null;
  created_at: string;
  updated_at: string;
}

interface EditingCell {
  rowId: number;
  column: string;
  value: string;
}

const DatabaseEdit: React.FC = () => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [newItem, setNewItem] = useState<Partial<GuideDBItem>>({
    item: '',
    standard_TAT: 1,
    comment: '',
    reference: '',
    phpsi_1: '',
    phpsi_2: '',
    phpsi_3: '',
    phpsi_4: '',
    phpsi_5: '',
    phpsi_6: '',
    phpsi_7: '',
    phpsi_8: '',
    phpsi_9: '',
    phpsi_10: ''
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Guide DB 데이터 조회
  const { data: guideData = [], isLoading, error } = useQuery<GuideDBItem[]>({
    queryKey: ['/api/guide-db'],
    queryFn: async () => {
      const response = await fetch('/api/guide-db');
      if (!response.ok) {
        throw new Error('Failed to fetch guide data');
      }
      return response.json();
    }
  });

  // 업데이트 뮤테이션
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GuideDBItem> }) => {
      const response = await fetch(`/api/guide-db/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guide-db'] });
    }
  });

  // 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: async (data: Partial<GuideDBItem>) => {
      const response = await fetch('/api/guide-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guide-db'] });
      setNewItem({
        item: '',
        standard_TAT: 1,
        comment: '',
        reference: '',
        phpsi_1: '',
        phpsi_2: '',
        phpsi_3: '',
        phpsi_4: '',
        phpsi_5: '',
        phpsi_6: '',
        phpsi_7: '',
        phpsi_8: '',
        phpsi_9: '',
        phpsi_10: ''
      });
      setIsAddDialogOpen(false);
    }
  });

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/guide-db/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guide-db'] });
    }
  });

  // 셀 클릭 핸들러
  const handleCellClick = (rowId: number, column: string, currentValue: any) => {
    if (column === 'id' || column === 'created_at' || column === 'updated_at') {
      return; // 읽기 전용 컬럼
    }
    
    setEditingCell({
      rowId,
      column,
      value: currentValue?.toString() || ''
    });
  };

  // 셀 값 변경 핸들러
  const handleCellChange = (value: string) => {
    if (editingCell) {
      setEditingCell({
        ...editingCell,
        value
      });
    }
  };

  // 셀 저장 핸들러
  const handleCellSave = () => {
    if (!editingCell) return;

    const item = guideData.find(item => item.id === editingCell.rowId);
    if (!item) return;

    const updatedData = {
      ...item,
      [editingCell.column]: editingCell.column === 'standard_TAT' 
        ? parseInt(editingCell.value) || 1 
        : editingCell.value
    };

    updateMutation.mutate({ id: editingCell.rowId, data: updatedData });
    setEditingCell(null);
  };

  // 셀 편집 취소
  const handleCellCancel = () => {
    setEditingCell(null);
  };

  // 행 삭제
  const handleDeleteRow = (id: number) => {
    if (window.confirm('이 항목을 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  // 새 항목 추가
  const handleAddItem = () => {
    createMutation.mutate(newItem);
  };

  const columns = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'item', label: '변경 아이템', width: '200px' },
    { key: 'standard_TAT', label: '표준 TAT(일)', width: '100px' },
    { key: 'comment', label: '코멘트', width: '200px' },
    { key: 'reference', label: '참고사항', width: '150px' },
    { key: 'phpsi_1', label: 'PHPSI 1', width: '120px' },
    { key: 'phpsi_2', label: 'PHPSI 2', width: '120px' },
    { key: 'phpsi_3', label: 'PHPSI 3', width: '120px' },
    { key: 'phpsi_4', label: 'PHPSI 4', width: '120px' },
    { key: 'phpsi_5', label: 'PHPSI 5', width: '120px' },
    { key: 'phpsi_6', label: 'PHPSI 6', width: '120px' },
    { key: 'phpsi_7', label: 'PHPSI 7', width: '120px' },
    { key: 'phpsi_8', label: 'PHPSI 8', width: '120px' },
    { key: 'phpsi_9', label: 'PHPSI 9', width: '120px' },
    { key: 'phpsi_10', label: 'PHPSI 10', width: '120px' },
  ];

  const renderCell = (item: GuideDBItem, column: { key: string; label: string }) => {
    const value = item[column.key as keyof GuideDBItem];
    const isEditing = editingCell?.rowId === item.id && editingCell?.column === column.key;

    if (column.key === 'id') {
      return <span className="text-gray-500">{value}</span>;
    }

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingCell.value}
            onChange={(e) => handleCellChange(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellSave();
              } else if (e.key === 'Escape') {
                handleCellCancel();
              }
            }}
          />
          <Button size="sm" variant="ghost" onClick={handleCellSave}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCellCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px] flex items-center"
        onClick={() => handleCellClick(item.id, column.key, value)}
      >
        <span className="text-sm">
          {value?.toString() || ''}
        </span>
        <Edit className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          데이터 로드 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>DB 수정</CardTitle>
              <CardDescription>
                Guide_DB 테이블을 엑셀처럼 편집할 수 있습니다. 셀을 클릭하여 수정하세요.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 항목 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>새 항목 추가</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="item">변경 아이템 *</Label>
                    <Input
                      id="item"
                      value={newItem.item || ''}
                      onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="standard_TAT">표준 TAT(일) *</Label>
                    <Input
                      id="standard_TAT"
                      type="number"
                      value={newItem.standard_TAT || 1}
                      onChange={(e) => setNewItem({...newItem, standard_TAT: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="comment">코멘트</Label>
                    <Input
                      id="comment"
                      value={newItem.comment || ''}
                      onChange={(e) => setNewItem({...newItem, comment: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="reference">참고사항</Label>
                    <Input
                      id="reference"
                      value={newItem.reference || ''}
                      onChange={(e) => setNewItem({...newItem, reference: e.target.value})}
                    />
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <div key={num} className="space-y-2">
                      <Label htmlFor={`phpsi_${num}`}>PHPSI {num}</Label>
                      <Input
                        id={`phpsi_${num}`}
                        value={newItem[`phpsi_${num}` as keyof typeof newItem] as string || ''}
                        onChange={(e) => setNewItem({...newItem, [`phpsi_${num}`]: e.target.value})}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddItem} disabled={!newItem.item || createMutation.isPending}>
                    {createMutation.isPending ? '추가 중...' : '추가'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      style={{ width: column.width }}
                      className="bg-gray-50 font-semibold text-xs"
                    >
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="bg-gray-50 w-16">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guideData.map((item) => (
                  <TableRow key={item.id} className="group">
                    {columns.map((column) => (
                      <TableCell
                        key={`${item.id}-${column.key}`}
                        className="p-0"
                      >
                        {renderCell(item, column)}
                      </TableCell>
                    ))}
                    <TableCell className="p-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRow(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            총 {guideData.length}개 항목 • 셀을 클릭하여 편집 • Enter로 저장, Escape로 취소
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseEdit;