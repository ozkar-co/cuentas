import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import type { Transaction } from '../services/transactions';
import type { Category } from '../services/categories';

interface TransactionEditModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
  categories: Category[];
  onSave: (transaction: Transaction) => void;
}

const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  open,
  onClose,
  transaction,
  categories,
  onSave
}) => {
  const [formData, setFormData] = useState<Transaction>({
    ...transaction,
    date: new Date(transaction.date)
  });

  useEffect(() => {
    setFormData({
      ...transaction,
      date: new Date(transaction.date)
    });
  }, [transaction]);

  const handleTextChange = (field: keyof Transaction) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'amount' ? Number(value) : value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      category_id: event.target.value
    }));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        date
      }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
    onClose();
  };

  const formatAmount = (amount: number) => {
    return Math.abs(amount).toString();
  };

  const filteredCategories = categories.filter(
    category => (formData.type === 'income' ? category.type === 'income' : category.type === 'expense')
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Editar Transacción</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={handleTextChange('description')}
              fullWidth
              required
            />

            <TextField
              label="Monto"
              value={formatAmount(formData.amount)}
              onChange={handleTextChange('amount')}
              type="number"
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                )
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.category_id || ''}
                onChange={handleSelectChange}
                label="Categoría"
              >
                {filteredCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha"
                value={formData.date}
                onChange={handleDateChange}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransactionEditModal; 