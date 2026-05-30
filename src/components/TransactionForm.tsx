import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Typography,
  SelectChangeEvent,
  InputAdornment,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { Category } from '../services/categories';
import type { ParsedTransaction } from '../services/transactions';

interface TransactionFormProps {
  categories: Category[];
  onParse: (text: string) => Promise<ParsedTransaction>;
  onSubmit: (transaction: ParsedTransaction & { date?: Date; raw_text?: string }) => Promise<void>;
}

const formatNumber = (num: string) => {
  const number = num.replace(/[^\d]/g, '');
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const unformatNumber = (num: string) => {
  return num.replace(/\./g, '');
};

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, onParse, onSubmit }) => {
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Editable confirmation fields
  const [confirmData, setConfirmData] = useState({
    amount: '',
    type: 'expense' as 'expense' | 'income',
    category_id: '',
    description: '',
    date: new Date(),
  });

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    setParseError(null);
    setParsed(null);
    try {
      const result = await onParse(rawText.trim());
      setParsed(result);
      setConfirmData({
        amount: formatNumber(String(result.amount)),
        type: result.type,
        category_id: result.category_id || '',
        description: result.description,
        date: new Date(),
      });
    } catch (e: any) {
      setParseError(e.message || 'Error al interpretar el texto');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      await onSubmit({
        amount: Number(unformatNumber(confirmData.amount)),
        type: confirmData.type,
        category_id: confirmData.category_id || undefined,
        category_name: categories.find(c => c.id === confirmData.category_id)?.name,
        description: confirmData.description,
        date: confirmData.date,
        raw_text: rawText,
      });
      setRawText('');
      setParsed(null);
      setConfirmData({ amount: '', type: 'expense', category_id: '', description: '', date: new Date() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setParseError(e.message || 'Error al guardar la transacción');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === confirmData.type);

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Registrar Movimiento
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ¡Transacción guardada correctamente!
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label="Describe tu movimiento"
          placeholder='Ej: "Me gasté 10 lucas en almuerzo" o "Me entraron 2 palos de salario"'
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleParse()}
          fullWidth
          multiline
          minRows={2}
          disabled={parsing || saving}
        />
        <Button
          variant="contained"
          onClick={handleParse}
          disabled={!rawText.trim() || parsing || saving}
          sx={{ minWidth: 100, alignSelf: 'flex-end' }}
        >
          {parsing ? <CircularProgress size={20} color="inherit" /> : 'Analizar'}
        </Button>
      </Box>

      {parseError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {parseError}
        </Alert>
      )}

      {parsed && (
        <>
          <Divider sx={{ my: 2 }}>
            <Chip label="Confirmar detalles" size="small" />
          </Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Monto"
                value={confirmData.amount}
                onChange={e =>
                  setConfirmData(p => ({ ...p, amount: formatNumber(e.target.value) }))
                }
                required
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
              <FormControl sx={{ minWidth: 130 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={confirmData.type}
                  label="Tipo"
                  onChange={(e: SelectChangeEvent) =>
                    setConfirmData(p => ({
                      ...p,
                      type: e.target.value as 'expense' | 'income',
                      category_id: '',
                    }))
                  }
                >
                  <MenuItem value="expense">Gasto</MenuItem>
                  <MenuItem value="income">Ingreso</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={confirmData.category_id}
                label="Categoría"
                onChange={(e: SelectChangeEvent) =>
                  setConfirmData(p => ({ ...p, category_id: e.target.value }))
                }
              >
                <MenuItem value="">Sin categoría</MenuItem>
                {filteredCategories.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Descripción"
              value={confirmData.description}
              onChange={e => setConfirmData(p => ({ ...p, description: e.target.value }))}
              required
              fullWidth
            />

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha"
                value={confirmData.date}
                onChange={date => date && setConfirmData(p => ({ ...p, date }))}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color={confirmData.type === 'expense' ? 'error' : 'success'}
                onClick={handleConfirm}
                disabled={saving || !confirmData.amount || !confirmData.description}
                fullWidth
              >
                {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => { setParsed(null); setParseError(null); }}
                disabled={saving}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default TransactionForm;
