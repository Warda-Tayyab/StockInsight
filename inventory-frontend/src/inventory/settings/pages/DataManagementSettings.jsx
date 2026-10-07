/** @module inventory/settings/pages/DataManagementSettings */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import settingsService from '../../../shared/services/settingsService';

const DataManagementSettings = () => {
  const fileRef = useRef(null);
  const restoreFileRef = useRef(null);

  const [summary, setSummary] = useState(null);
  const [backupsList, setBackupsList] = useState([]);
  const [schedule, setSchedule] = useState({
    autoBackupEnabled: true,
    frequency: 'daily',
    retentionDays: 14,
    lastBackupAt: null,
    lastBackupStatus: 'never',
    lastBackupMessage: '',
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedRestoreFile, setSelectedRestoreFile] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, target: null, type: '' });

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [sumRes, listRes, schedRes] = await Promise.allSettled([
        settingsService.getBackupSummary(),
        settingsService.getBackupsList(),
        settingsService.getScheduleConfig(),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data.data);
      if (listRes.status === 'fulfilled') setBackupsList(listRes.value.data.data || []);
      if (schedRes.status === 'fulfilled') setSchedule(schedRes.value.data.data || {});
    } catch (err) {
      console.error('[DataManagement] Load error:', err);
      toast.error('Failed to load data backup settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --- 1. Manual Backup Creation ---
  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await settingsService.createManualBackup();
      toast.success(res.data.message || 'Backup snapshot created successfully');
      await loadAllData();
    } catch (err) {
      console.error('[Backup Create] error', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to create backup snapshot');
    } finally {
      setCreatingBackup(false);
    }
  };

  // --- 2. Schedule Update ---
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSavingSchedule(true);
    try {
      const res = await settingsService.updateScheduleConfig(schedule);
      toast.success(res.data.message || 'Schedule configuration saved');
      if (res.data.data) setSchedule(res.data.data);
    } catch (err) {
      console.error('[Schedule Save] error', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  // --- 3. Download Server Backup ---
  const handleDownloadBackup = async (filename) => {
    try {
      const res = await settingsService.downloadBackupFile(filename);
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.error('[Download Backup] error', err);
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  // --- 4. Delete Server Backup ---
  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete backup file "${filename}"?`)) return;
    try {
      const res = await settingsService.deleteBackupFile(filename);
      toast.success(res.data.message || 'Backup deleted');
      await loadAllData();
    } catch (err) {
      console.error('[Delete Backup] error', err);
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // --- 5. Restore Database Handler ---
  const triggerRestoreConfirm = (target, type = 'server') => {
    setConfirmModal({ open: true, target, type });
  };

  const handleExecuteRestore = async () => {
    const { target, type } = confirmModal;
    setConfirmModal({ open: false, target: null, type: '' });
    setRestoring(true);

    try {
      let res;
      if (type === 'server') {
        res = await settingsService.restoreBackup({ filename: target }, false);
      } else if (type === 'upload') {
        const formData = new FormData();
        formData.append('file', target);
        res = await settingsService.restoreBackup(formData, true);
      }

      toast.success(res?.data?.message || 'Store data restored successfully!');
      setSelectedRestoreFile(null);
      if (restoreFileRef.current) restoreFileRef.current.value = '';
      await loadAllData();
    } catch (err) {
      console.error('[Restore] error', err);
      toast.error(err.response?.data?.message || err.message || 'Data restore failed');
    } finally {
      setRestoring(false);
    }
  };

  // --- Excel Export & Product Import ---
  const handleExportExcel = async (type) => {
    setExporting(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const res = await settingsService.exportDataFile(type);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${type}-${stamp}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel export ready');
    } catch (err) {
      console.error('[Export] error', err);
      toast.error(err.response?.data?.message || err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        name: 'Sample Product 1',
        sku: 'PROD-001',
        category: 'Electronics',
        barcode: '123456789',
        costPrice: 50,
        sellingPrice: 100,
        unit: 'pcs',
        initialStock: 25,
        reorderLevel: 5,
        supplierName: 'ABC Corp',
        status: 'active',
      },
      {
        name: 'Sample Product 2',
        sku: 'PROD-002',
        category: 'Groceries',
        barcode: '987654321',
        costPrice: 20,
        sellingPrice: 40,
        unit: 'kg',
        initialStock: 50,
        reorderLevel: 10,
        supplierName: 'XYZ Traders',
        status: 'active',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'sample_product_import_template.xlsx');
    toast.success('Sample template downloaded');
  };

  const pickProductSheet = (workbook) => {
    const byName = workbook.SheetNames.find((n) => n.trim().toLowerCase() === 'products');
    if (byName) return workbook.Sheets[byName];

    let bestSheet = workbook.Sheets[workbook.SheetNames[0]];
    let bestScore = -1;
    workbook.SheetNames.forEach((name) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' });
      const score = rows.filter((row) => {
        const keys = Object.keys(row).map((k) => k.trim().toLowerCase());
        const hasName = keys.some((k) => ['name', 'product name', 'item name'].includes(k));
        const hasSku = keys.some((k) => k === 'sku');
        return hasName && hasSku;
      }).length;
      if (score > bestScore) {
        bestScore = score;
        bestSheet = workbook.Sheets[name];
      }
    });
    return bestSheet;
  };

  const normalizeImportRow = (row) => {
    const normalized = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[key.trim().replace(/\u00a0/g, ' ')] = value;
    });
    return normalized;
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = pickProductSheet(wb);
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!rows.length) {
        toast.error('File has no rows');
        return;
      }
      const getVal = (row, keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return row[k];
          }
        }
        const rowKeys = Object.keys(row);
        for (const targetKey of keys) {
          const targetLower = targetKey.toLowerCase();
          const match = rowKeys.find((rk) => rk.trim().toLowerCase() === targetLower);
          if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
            return row[match];
          }
        }
        return '';
      };

      const parseNum = (val, fallback = 0) => {
        if (val === undefined || val === null || val === '') return fallback;
        if (typeof val === 'number') return isNaN(val) ? fallback : val;
        const cleaned = String(val).replace(/,/g, '').trim();
        const num = Number(cleaned);
        return isNaN(num) ? fallback : num;
      };

      const products = rows
        .map((raw) => {
          const r = normalizeImportRow(raw);
          return {
            name: String(getVal(r, ['name', 'Name', 'Product Name', 'product name', 'Item Name'])).trim(),
            sku: String(getVal(r, ['sku', 'SKU', 'Sku'])).trim(),
            category: String(getVal(r, ['category', 'Category', 'categoryName', 'Category Name', 'category_name', 'CategoryName'])).trim(),
            barcode: String(getVal(r, ['barcode', 'Barcode'])).trim(),
            costPrice: parseNum(getVal(r, ['costPrice', 'CostPrice', 'cost', 'Cost', 'Cost Price'])),
            sellingPrice: parseNum(getVal(r, ['sellingPrice', 'SellingPrice', 'price', 'Price', 'Selling Price'])),
            unit: String(getVal(r, ['unit', 'Unit']) || 'pcs').trim(),
            reorderLevel: parseNum(getVal(r, ['reorderLevel', 'ReorderLevel', 'reorder', 'Reorder', 'Reorder Level']), 5),
            supplierName: String(getVal(r, ['supplierName', 'SupplierName', 'supplier', 'Supplier', 'Supplier Name']) || 'Imported').trim(),
            status: String(getVal(r, ['status', 'Status']) || 'active').trim(),
          };
        })
        .filter((p) => p.name && p.sku);

      if (!products.length) {
        toast.error('No valid product rows found (name and sku required)');
        return;
      }

      const res = await settingsService.importProducts(products);
      const { message, skipped, errors } = res.data;
      if (skipped > 0 && errors?.length) {
        const detail = errors.map((e) => `Row ${e.row}: ${e.message}`).join(' · ');
        toast.error(`${message}. ${detail}`);
      } else {
        toast.success(message || 'Import complete');
      }
      await loadAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) return <div className="py-12 text-center text-slate-500 font-medium">Loading data backup settings…</div>;

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* 1. Store Data Overview */}
      <div className="card-padded bg-white shadow-sm rounded-xl border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Data Snapshot Overview</h2>
        <p className="text-sm text-slate-500 mb-4">Current record counts in database for this store</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            ['Products', summary?.products],
            ['Sales', summary?.sales],
            ['Warehouses', summary?.warehouses],
            ['Users', summary?.users],
            ['Notifications', summary?.notifications],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
              <p className="text-xs text-slate-500 font-semibold uppercase">{label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{value ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Automated Scheduled Backup Settings */}
      <div className="card-padded bg-white shadow-sm rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Automated Backup Schedule</h2>
            <p className="text-sm text-slate-500">Configure background cron backup schedules & retention policy</p>
          </div>
          {schedule?.lastBackupAt && (
            <span className="text-xs font-medium px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 self-start sm:self-auto">
              Last backup: {new Date(schedule.lastBackupAt).toLocaleString()}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSchedule} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoBackupEnabled"
              checked={!!schedule.autoBackupEnabled}
              onChange={(e) => setSchedule({ ...schedule, autoBackupEnabled: e.target.checked })}
              className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="autoBackupEnabled" className="text-sm font-medium text-slate-800 cursor-pointer">
              Enable Automated Background Backups
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Backup Frequency</label>
              <select
                value={schedule.frequency || 'daily'}
                onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="daily">Daily (Every 24 Hours)</option>
                <option value="weekly">Weekly (Every 7 Days)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Retention Policy (Days to keep)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={schedule.retentionDays || 14}
                onChange={(e) => setSchedule({ ...schedule, retentionDays: Number(e.target.value) })}
                className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={savingSchedule}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {savingSchedule ? 'Saving...' : 'Save Schedule Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Manual Backup & Excel Export */}
      <div className="card-padded bg-white shadow-sm rounded-xl border border-slate-200 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">On-Demand Backup & Export</h2>
          <p className="text-sm text-slate-500">Create instant JSON system snapshots or export spreadsheets</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={creatingBackup}
            onClick={handleCreateBackup}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
          >
            {creatingBackup ? 'Creating Snapshot...' : '⚡ Create Backup Now'}
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExportExcel('all')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            📊 Export Full Excel Sheet
          </button>
        </div>
      </div>

      {/* 4. Saved Backup Snapshots History */}
      <div className="card-padded bg-white shadow-sm rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Saved Server Backups</h2>
            <p className="text-sm text-slate-500">History of automated and manual database snapshots stored on server</p>
          </div>
          <button
            onClick={loadAllData}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Refresh List
          </button>
        </div>

        {backupsList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
            No backup snapshots found. Click "Create Backup Now" to create your first database snapshot.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Filename</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Records</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {backupsList.map((b) => (
                  <tr key={b.filename} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono text-xs font-semibold text-slate-800">{b.filename}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          b.backupType === 'scheduled'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : b.backupType === 'pre-restore-safety'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {b.backupType}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{b.totalRecords}</td>
                    <td className="p-3 text-slate-600">{formatFileSize(b.sizeBytes)}</td>
                    <td className="p-3 text-slate-500 text-xs">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadBackup(b.filename)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition"
                          title="Download snapshot JSON"
                        >
                          📥 Download
                        </button>
                        <button
                          onClick={() => triggerRestoreConfirm(b.filename, 'server')}
                          disabled={restoring}
                          className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium border border-amber-200 rounded transition disabled:opacity-50"
                          title="Restore store data from this snapshot"
                        >
                          🔄 Restore
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(b.filename)}
                          className="px-2.5 py-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium border border-rose-200 rounded transition"
                          title="Delete snapshot"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Upload Backup File & Restore */}
      <div className="card-padded bg-white shadow-sm rounded-xl border border-slate-200 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Restore Data from Local Backup File</h2>
          <p className="text-sm text-slate-500">Upload a previously downloaded `.json` snapshot file to restore store state</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            ref={restoreFileRef}
            type="file"
            accept=".json"
            onChange={(e) => setSelectedRestoreFile(e.target.files?.[0] || null)}
            className="block text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
          {selectedRestoreFile && (
            <button
              type="button"
              disabled={restoring}
              onClick={() => triggerRestoreConfirm(selectedRestoreFile, 'upload')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-lg transition disabled:opacity-50"
            >
              {restoring ? 'Restoring...' : '🔄 Restore from Selected File'}
            </button>
          )}
        </div>
      </div>

      {/* 6. Product Excel Import */}
      {/* <div className="card-padded bg-white shadow-sm rounded-xl border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Import Products & Auto-Generate Purchase Orders</h2>
            <p className="text-sm text-slate-500">
              Upload CSV/Excel (columns: name, sku, category, barcode, costPrice, sellingPrice, unit, initialStock, supplierName). Auto-creates products, Vendors, and official Purchase Orders/Stock Receipts for complete audit history.
            </p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 shrink-0 self-start sm:self-auto transition"
            onClick={handleDownloadSampleTemplate}
          >
            Download Sample Template
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="block text-sm"
          disabled={importing}
          onChange={handleImportFile}
        />
        {importing && <p className="text-sm text-slate-500">Importing products…</p>}
      </div> */}

      {/* Confirmation Modal for Data Restore */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-amber-600">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-bold text-slate-900">Confirm Data Restoration</h3>
            </div>
            <p className="text-sm text-slate-600">
              Restoring database state will replace current store data with records from the snapshot:
              <br />
              <strong className="font-mono text-xs text-slate-800 break-all">
                {confirmModal.type === 'server' ? confirmModal.target : confirmModal.target?.name}
              </strong>
            </p>
            <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800 border border-amber-200">
              <strong>Note:</strong> An automatic pre-restore safety backup snapshot will be saved before restoring.
            </div>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, target: null, type: '' })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition"
              >
                Yes, Restore Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementSettings;
