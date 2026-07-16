import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertCircle, Edit2, Trash2, Check, X, Box } from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'معدات تنظيف' | 'مواد كيميائية' | 'مستهلكات' | 'أخرى';
  quantity: number;
  min_quantity: number;
  last_updated: string;
  status: 'متوفر' | 'منخفض' | 'نفد';
}

export default function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    category: 'معدات تنظيف',
    quantity: 0,
    min_quantity: 5
  });

  // Load from local storage to avoid firebase rule issues for now
  useEffect(() => {
    const saved = localStorage.getItem('naris_inventory_data');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default dummy data
      const initial: InventoryItem[] = [
        { id: '1', name: 'ملمع زجاج', category: 'مواد كيميائية', quantity: 25, min_quantity: 10, last_updated: new Date().toISOString(), status: 'متوفر' },
        { id: '2', name: 'مكنسة كهربائية', category: 'معدات تنظيف', quantity: 3, min_quantity: 5, last_updated: new Date().toISOString(), status: 'منخفض' },
        { id: '3', name: 'أكياس قمامة كبيرة', category: 'مستهلكات', quantity: 0, min_quantity: 20, last_updated: new Date().toISOString(), status: 'نفد' },
      ];
      setItems(initial);
      localStorage.setItem('naris_inventory_data', JSON.stringify(initial));
    }
  }, []);

  const saveItems = (newItems: InventoryItem[]) => {
    setItems(newItems);
    localStorage.setItem('naris_inventory_data', JSON.stringify(newItems));
  };

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity === undefined) return;
    
    const qty = Number(newItem.quantity);
    const minQty = Number(newItem.min_quantity || 5);
    
    let status: InventoryItem['status'] = 'متوفر';
    if (qty === 0) status = 'نفد';
    else if (qty <= minQty) status = 'منخفض';

    const item: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      category: newItem.category as any,
      quantity: qty,
      min_quantity: minQty,
      last_updated: new Date().toISOString(),
      status
    };

    saveItems([item, ...items]);
    setIsAdding(false);
    setNewItem({ category: 'معدات تنظيف', quantity: 0, min_quantity: 5 });
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      saveItems(items.filter(i => i.id !== id));
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    saveItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        let status: InventoryItem['status'] = 'متوفر';
        if (newQty === 0) status = 'نفد';
        else if (newQty <= item.min_quantity) status = 'منخفض';
        
        return { ...item, quantity: newQty, status, last_updated: new Date().toISOString() };
      }
      return item;
    }));
  };

  const filteredItems = items.filter(i => i.name.includes(search) || i.category.includes(search));

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-600" />
            إدارة المخزون والمعدات
          </h2>
          <p className="text-xs text-slate-500 mt-1">تتبع مستلزمات التنظيف والمواد الكيميائية والأجهزة التشغيلية</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'إلغاء' : 'إضافة عنصر جديد'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-sm font-bold text-indigo-800 mb-4">بيانات العنصر الجديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-indigo-700 mb-1">اسم العنصر</label>
              <input 
                type="text" 
                value={newItem.name || ''} 
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full border border-indigo-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="مثال: مناديل ورقية"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">التصنيف</label>
              <select 
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value as any})}
                className="w-full border border-indigo-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="معدات تنظيف">معدات تنظيف</option>
                <option value="مواد كيميائية">مواد كيميائية</option>
                <option value="مستهلكات">مستهلكات</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">الكمية الحالية</label>
              <input 
                type="number" 
                value={newItem.quantity} 
                onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                className="w-full border border-indigo-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">الحد الأدنى (للتنبيه)</label>
              <input 
                type="number" 
                value={newItem.min_quantity} 
                onChange={(e) => setNewItem({...newItem, min_quantity: Number(e.target.value)})}
                className="w-full border border-indigo-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleAddItem}
              className="bg-indigo-600 text-white py-2 px-6 rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
            >
              حفظ العنصر
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ابحث في المخزون..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
          <div className="flex gap-2 text-xs font-bold">
            <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100">
              متوفر: {items.filter(i => i.status === 'متوفر').length}
            </span>
            <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded border border-amber-100">
              منخفض: {items.filter(i => i.status === 'منخفض').length}
            </span>
            <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded border border-rose-100">
              نفد: {items.filter(i => i.status === 'نفد').length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold">
                <th className="p-4">العنصر</th>
                <th className="p-4">التصنيف</th>
                <th className="p-4 text-center">الكمية</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">لا توجد عناصر مطابقة للبحث</td>
                </tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">تحديث: {new Date(item.last_updated).toLocaleString('ar-EG')}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold transition">-</button>
                      <span className="font-black text-slate-800 w-8">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold transition">+</button>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">الحد الأدنى: {item.min_quantity}</div>
                  </td>
                  <td className="p-4 text-center">
                    {item.status === 'متوفر' && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full"><Check className="w-3 h-3" /> متوفر</span>}
                    {item.status === 'منخفض' && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> منخفض</span>}
                    {item.status === 'نفد' && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full"><X className="w-3 h-3" /> نفد</span>}
                  </td>
                  <td className="p-4 text-left">
                    <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-500 transition p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
