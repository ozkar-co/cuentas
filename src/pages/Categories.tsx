import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  RadioGroup,
  Radio,
  FormControlLabel
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  type Category
} from '../services/categories';

interface CategoryFormData {
  name: string;
  type: 'expense' | 'income';
  color: string;
}

const EXPENSE_COLORS = [
  { name: 'Rojo', value: '#f44336' },
  { name: 'Rosa', value: '#e91e63' },
  { name: 'Púrpura', value: '#9c27b0' },
  { name: 'Índigo', value: '#3f51b5' },
  { name: 'Azul', value: '#2196f3' },
];

const INCOME_COLORS = [
  { name: 'Verde', value: '#4caf50' },
  { name: 'Verde Lima', value: '#8bc34a' },
  { name: 'Verde Azulado', value: '#009688' },
  { name: 'Ámbar', value: '#ffc107' },
  { name: 'Naranja', value: '#ff9800' },
];

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'expense',
    color: EXPENSE_COLORS[0].value
  });
  const [customColor, setCustomColor] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const userCategories = await getCategories();
      setCategories(userCategories);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color || (category.type === 'expense' ? EXPENSE_COLORS[0].value : INCOME_COLORS[0].value)
      });
      setCustomColor(!EXPENSE_COLORS.concat(INCOME_COLORS).some(c => c.value === category.color));
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'expense',
        color: EXPENSE_COLORS[0].value
      });
      setCustomColor(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense',
      color: EXPENSE_COLORS[0].value
    });
    setCustomColor(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await addCategory(formData);
      }
      await loadCategories();
      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.is_default) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      try {
        await deleteCategory(category.id);
        await loadCategories();
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
      }
    }
  };

  const handleTypeChange = (type: 'expense' | 'income') => {
    setFormData({
      ...formData,
      type,
      color: type === 'expense' ? EXPENSE_COLORS[0].value : INCOME_COLORS[0].value
    });
    setCustomColor(false);
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Categorías</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Nueva Categoría
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper>
              <Typography variant="h6" sx={{ p: 2, bgcolor: 'error.light', color: 'white' }}>
                Categorías de Gastos
              </Typography>
              <List>
                {expenseCategories.map((category) => (
                  <ListItem key={category.id} divider>
                    <ListItemText
                      primary={category.name}
                      secondary={
                        <Box
                          component="span"
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            display: 'inline-block',
                            bgcolor: category.color || EXPENSE_COLORS[0].value,
                            mr: 1,
                            verticalAlign: 'middle'
                          }}
                        />
                      }
                    />
                    {!category.is_default && (
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleOpenDialog(category)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(category)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper>
              <Typography variant="h6" sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                Categorías de Ingresos
              </Typography>
              <List>
                {incomeCategories.map((category) => (
                  <ListItem key={category.id} divider>
                    <ListItemText
                      primary={category.name}
                      secondary={
                        <Box
                          component="span"
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            display: 'inline-block',
                            bgcolor: category.color || INCOME_COLORS[0].value,
                            mr: 1,
                            verticalAlign: 'middle'
                          }}
                        />
                      }
                    />
                    {!category.is_default && (
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleOpenDialog(category)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(category)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <TextField
                  label="Nombre"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  fullWidth
                />

                <FormControl>
                  <RadioGroup
                    row
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value as 'expense' | 'income')}
                  >
                    <FormControlLabel
                      value="expense"
                      control={<Radio />}
                      label="Gasto"
                    />
                    <FormControlLabel
                      value="income"
                      control={<Radio />}
                      label="Ingreso"
                    />
                  </RadioGroup>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Color</InputLabel>
                  <Select
                    value={customColor ? 'custom' : formData.color}
                    label="Color"
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setCustomColor(true);
                      } else {
                        setCustomColor(false);
                        setFormData({ ...formData, color: e.target.value });
                      }
                    }}
                  >
                    {(formData.type === 'expense' ? EXPENSE_COLORS : INCOME_COLORS).map((color) => (
                      <MenuItem key={color.value} value={color.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: color.value
                            }}
                          />
                          {color.name}
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem value="custom">Color personalizado</MenuItem>
                  </Select>
                </FormControl>

                {customColor && (
                  <TextField
                    label="Código de color (HEX)"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#000000"
                    fullWidth
                  />
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" variant="contained" color="primary">
                Guardar
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Categories; 