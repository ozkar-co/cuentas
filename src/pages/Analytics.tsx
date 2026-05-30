import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/auth';
import { getTransactionsByMonthRange } from '../services/transactions';
import { getCategories } from '../services/categories';
import { format, subMonths, startOfMonth} from 'date-fns';
import { es } from 'date-fns/locale';
import type { Category } from '../services/categories';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics: React.FC = () => {
  const [user] = useAuthState(auth);
  const [timeRange, setTimeRange] = useState(6); // meses
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [incomeCategoryData, setIncomeCategoryData] = useState<any[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trends, setTrends] = useState<any>({});
  const [predictions, setPredictions] = useState<any>({});
  const [topDays, setTopDays] = useState<any>({});

  useEffect(() => {
    const loadCategories = async () => {
      if (user) {
        try {
          const userCategories = await getCategories();
          setCategories(userCategories);
        } catch (error) {
          console.error('Error al cargar categorías:', error);
        }
      }
    };
    loadCategories();
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const endDate = new Date();
          const startDate = subMonths(startOfMonth(endDate), timeRange - 1);
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth() + 1;
          const endYear = endDate.getFullYear();
          const endMonth = endDate.getMonth() + 1;
          const transactions = await getTransactionsByMonthRange(startYear, startMonth, endYear, endMonth);

          // Procesar datos mensuales
          const monthlyStats = new Map();
          const categoryTrends = new Map();
          const dailyStats = new Map();

          transactions.forEach(transaction => {
            const monthKey = format(transaction.date, 'yyyy-MM');
            const dayKey = format(transaction.date, 'dd');
            const amount = transaction.amount;

            // Estadísticas mensuales
            if (!monthlyStats.has(monthKey)) {
              monthlyStats.set(monthKey, {
                month: format(transaction.date, 'MMM yyyy', { locale: es }),
                income: 0,
                expenses: 0
              });
            }
            const stats = monthlyStats.get(monthKey);
            if (transaction.type === 'income') {
              stats.income += amount;
            } else {
              stats.expenses += amount;
            }

            // Tendencias por categoría
            const categoryKey = transaction.category_id || transaction.category_name || 'Sin categoría';
            if (!categoryTrends.has(categoryKey)) {
              categoryTrends.set(categoryKey, {
                values: new Array(timeRange).fill(0),
                type: transaction.type
              });
            }
            const monthIndex = timeRange - 1 - Math.floor((endDate.getTime() - transaction.date.getTime()) / (30 * 24 * 60 * 60 * 1000));
            if (monthIndex >= 0) {
              categoryTrends.get(categoryKey).values[monthIndex] += amount;
            }

            // Estadísticas diarias
            if (!dailyStats.has(dayKey)) {
              dailyStats.set(dayKey, { income: 0, expenses: 0 });
            }
            if (transaction.type === 'income') {
              dailyStats.get(dayKey).income += amount;
            } else {
              dailyStats.get(dayKey).expenses += amount;
            }
          });

          setMonthlyData(Array.from(monthlyStats.values()));

          // Calcular tendencias y predicciones
          const trends: any = {};
          const predictions: any = {};
          categoryTrends.forEach((data, categoryKey) => {
            const values = data.values.filter((v: number) => v > 0);
            if (values.length > 1) {
              const trend = (values[values.length - 1] - values[0]) / values[0] * 100;
              const avgChange = values.reduce((acc: number, val: number, i: number) => {
                if (i === 0) return 0;
                return acc + (val - values[i - 1]);
              }, 0) / (values.length - 1);
              
              const category = categories.find(c => c.id === categoryKey || c.name === categoryKey);
              const label = category?.name || categoryKey;
              trends[label] = trend;
              predictions[label] = values[values.length - 1] + avgChange;
            }
          });
          setTrends(trends);
          setPredictions(predictions);

          // Encontrar días más activos
          const sortedDays = Array.from(dailyStats.entries())
            .sort((a, b) => b[1].income - a[1].income || b[1].expenses - a[1].expenses);
          setTopDays({
            income: sortedDays.filter(([_, stats]) => stats.income > 0).slice(0, 2),
            expenses: sortedDays.filter(([_, stats]) => stats.expenses > 0).slice(0, 2)
          });

          // Procesar datos por categoría
          const incomeStats = new Map();
          const expenseStats = new Map();
          
          transactions.forEach(transaction => {
            const categoryName = transaction.category_name ||
              categories.find(cat => cat.id === transaction.category_id)?.name ||
              'Sin categoría';
            const amount = transaction.amount;
            
            if (transaction.type === 'income') {
              if (!incomeStats.has(categoryName)) {
                incomeStats.set(categoryName, 0);
              }
              incomeStats.set(categoryName, incomeStats.get(categoryName) + amount);
            } else {
              if (!expenseStats.has(categoryName)) {
                expenseStats.set(categoryName, 0);
              }
              expenseStats.set(categoryName, expenseStats.get(categoryName) + amount);
            }
          });

          setIncomeCategoryData(
            Array.from(incomeStats.entries()).map(([name, value]) => ({
              name,
              value
            }))
          );

          setExpenseCategoryData(
            Array.from(expenseStats.entries()).map(([name, value]) => ({
              name,
              value
            }))
          );

        } catch (error) {
          console.error('Error al cargar datos para análisis:', error);
        }
      }
    };

    loadData();
  }, [user, timeRange, categories]);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value);
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 'N/A';
    const growth = ((current - previous) / previous) * 100;
    return `${growth.toFixed(1)}%`;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Análisis y Estadísticas
        </Typography>

        <Box sx={{ '@media print': { display: 'none' } }}>
          <FormControl sx={{ mb: 4, minWidth: 200 }}>
            <InputLabel>Rango de Tiempo</InputLabel>
            <Select
              value={timeRange}
              label="Rango de Tiempo"
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <MenuItem value={1}>Último mes</MenuItem>
              <MenuItem value={3}>Últimos 3 meses</MenuItem>
              <MenuItem value={6}>Últimos 6 meses</MenuItem>
              <MenuItem value={12}>Último año</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ingresos vs Gastos por Mes
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatAmount} />
                  <Tooltip formatter={formatAmount} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Ingresos"
                    stroke="#00C49F"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Gastos"
                    stroke="#FF8042"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Distribución de Ingresos por Categoría
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                {incomeCategoryData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={incomeCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {incomeCategoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatAmount} />
                  </PieChart>
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography variant="body1" color="text.secondary">
                      Aún no hay datos suficientes.
                    </Typography>
                  </Box>
                )}
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Distribución de Gastos por Categoría
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                {expenseCategoryData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {expenseCategoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatAmount} />
                  </PieChart>
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography variant="body1" color="text.secondary">
                      Aún no hay datos suficientes.
                    </Typography>
                  </Box>
                )}
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Resumen del Período
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Métricas Principales
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Total Ingresos: {formatAmount(
                        monthlyData.reduce((sum, month) => sum + month.income, 0)
                      )}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Total Gastos: {formatAmount(
                        monthlyData.reduce((sum, month) => sum + month.expenses, 0)
                      )}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Balance Neto: {formatAmount(
                        monthlyData.reduce((sum, month) => sum + month.income - month.expenses, 0)
                      )}
                    </Typography>
                    {monthlyData.length > 1 && (
                      <>
                        <Typography variant="body1" gutterBottom>
                          Crecimiento Ingresos: {calculateGrowth(
                            monthlyData[monthlyData.length - 1].income,
                            monthlyData[monthlyData.length - 2].income
                          )}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          Crecimiento Gastos: {calculateGrowth(
                            monthlyData[monthlyData.length - 1].expenses,
                            monthlyData[monthlyData.length - 2].expenses
                          )}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Días más Activos
                    </Typography>
                    {topDays.income?.length > 0 && (
                      <Typography variant="body1" gutterBottom>
                        Los días {topDays.income.map(([day]: [string, any]) => day).join(' y ')} fueron los días con mayores ingresos.
                      </Typography>
                    )}
                    {topDays.expenses?.length > 0 && (
                      <Typography variant="body1" gutterBottom>
                        Los días {topDays.expenses.map(([day]: [string, any]) => day).join(' y ')} fueron los días con mayores gastos.
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tendencias y Predicciones
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Tendencias por Categoría
                  </Typography>
                  {Object.entries(trends).length > 0 ? (
                    Object.entries(trends).map(([category, trend]) => (
                      <Typography key={category} variant="body1" gutterBottom>
                        {category}: {Number(trend) > 0 ? '↑' : '↓'} {Math.abs(Number(trend)).toFixed(1)}%
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Aún no hay datos suficientes.
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Proyecciones para el Próximo Mes
                  </Typography>
                  {Object.entries(predictions).length > 0 ? (
                    Object.entries(predictions).map(([category, prediction]) => (
                      <Typography key={category} variant="body1" gutterBottom>
                        {category}: {formatAmount(Number(prediction))}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Aún no hay datos suficientes.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Analytics; 