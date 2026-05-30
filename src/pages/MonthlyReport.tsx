import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button
} from '@mui/material';
import { Delete as DeleteIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/auth';
import { getTransactionsByMonth, deleteTransaction } from '../services/transactions';
import { getCategories } from '../services/categories';
import type { Transaction } from '../services/transactions';
import type { Category } from '../services/categories';

const MonthlyReport: React.FC = () => {
  const [user] = useAuthState(auth);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const userCategories = await getCategories();
        setCategories(userCategories);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    loadCategories();
  }, [user]);

  const loadTransactions = async () => {
    if (user) {
      try {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const monthlyTransactions = await getTransactionsByMonth(year, month);
        setTransactions(monthlyTransactions);

        const totals = monthlyTransactions.reduce(
          (acc, transaction) => {
            if (transaction.type === 'income') {
              acc.totalIncome += transaction.amount;
            } else {
              acc.totalExpenses += transaction.amount;
            }
            return acc;
          },
          { totalIncome: 0, totalExpenses: 0 }
        );

        setSummary({
          ...totals,
          balance: totals.totalIncome - totals.totalExpenses
        });
      } catch (error) {
        console.error('Error al cargar transacciones:', error);
      }
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user, selectedDate]);

  const handleDelete = async (transactionId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      try {
        await deleteTransaction(transactionId);
        await loadTransactions();
      } catch (error) {
        console.error('Error al eliminar transacción:', error);
      }
    }
  };

  const getCategoryName = (transaction: Transaction) => {
    return transaction.category_name ||
      categories.find(cat => cat.id === transaction.category_id)?.name ||
      'Sin categoría';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(Math.abs(amount));
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto'];
    const csvData = transactions.map(transaction => [
      format(transaction.date, 'dd/MM/yyyy'),
      transaction.description,
      getCategoryName(transaction),
      transaction.type === 'income' ? transaction.amount.toString() : (-transaction.amount).toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_mensual_${format(selectedDate, 'MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Reporte Mensual
          </Typography>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCSV}
            sx={{ 
              ml: 2,
              '@media print': {
                display: 'none'
              }
            }}
          >
            Exportar CSV
          </Button>
        </Box>

        <Box sx={{ '@media print': { display: 'none' } }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Seleccionar Mes"
              value={selectedDate}
              onChange={(newDate) => newDate && setSelectedDate(newDate)}
              views={['year', 'month']}
              defaultValue={new Date()}
              sx={{ mb: 4 }}
            />
          </LocalizationProvider>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Paper 
            className="summary-card"
            sx={{ 
              p: 3,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 3
            }}
          >
            <Box>
              <Typography variant="subtitle2">Ingresos del Mes</Typography>
              <Typography variant="h6" className="success">
                {formatAmount(summary.totalIncome)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Gastos del Mes</Typography>
              <Typography variant="h6" className="error">
                {formatAmount(summary.totalExpenses)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Balance</Typography>
              <Typography
                variant="h6"
                className={summary.balance >= 0 ? 'success' : 'error'}
              >
                {formatAmount(summary.balance)}
              </Typography>
            </Box>
          </Paper>
        </Box>

        <TableContainer component={Paper} className="paper">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell 
                  align="center"
                  sx={{ '@media print': { display: 'none' } }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{format(transaction.date, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{
                    <Chip
                      label={getCategoryName(transaction)}
                      color={transaction.type === 'income' ? 'success' : 'error'}
                      size="small"
                    />
                  }</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: transaction.type === 'income' ? 'success.main' : 'error.main',
                    }}
                  >
                    {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ '@media print': { display: 'none' } }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      </Box>
    </Container>
  );
};

export default MonthlyReport; 