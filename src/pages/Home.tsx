import React, { useState, useEffect } from 'react';
import { Container, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/auth';
import AuthModal from '../components/AuthModal';
import TransactionForm from '../components/TransactionForm';
import { getCategories } from '../services/categories';
import { addTransaction, parseTransaction } from '../services/transactions';
import type { Category } from '../services/categories';
import type { ParsedTransaction } from '../services/transactions';

const Home: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!user && !loading) {
      setShowAuthModal(true);
    }
  }, [user, loading]);

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

  const handleParse = async (text: string): Promise<ParsedTransaction> => {
    return parseTransaction(text);
  };

  const handleTransactionSubmit = async (transaction: ParsedTransaction & { date?: Date; raw_text?: string }) => {
    try {
      await addTransaction(transaction);
    } catch (error) {
      console.error('Error al guardar la transacción:', error);
      throw error;
    }
  };

  if (loading) {
    return <Box>Cargando...</Box>;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <TransactionForm
          categories={categories}
          onParse={handleParse}
          onSubmit={handleTransactionSubmit}
        />
        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </Box>
    </Container>
  );
};

export default Home;
