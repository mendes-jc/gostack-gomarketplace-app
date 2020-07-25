import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem('@GoBarber/cart');

      if (data) {
        setProducts(JSON.parse(data));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const product = products.find(foundProduct => foundProduct.id === id);

      if (product) {
        const newProducts = products.map(current => {
          if (current.id === id) {
            return { ...current, quantity: current.quantity + 1 };
          }
          return current;
        });

        setProducts(newProducts);
      }
      await AsyncStorage.setItem('@GoBarber/cart', JSON.stringify(products));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const alreadyAdded = products.find(
        foundProduct => foundProduct.id === product.id,
      );

      if (!alreadyAdded) {
        setProducts([...products, { ...product, quantity: 1 }]);
      } else {
        increment(product.id);
      }

      await AsyncStorage.setItem('@GoBarber/cart', JSON.stringify(products));
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(
        foundProduct => foundProduct.id === id,
      );

      if (productIndex !== -1) {
        if (products[productIndex].quantity <= 1) {
          const newProducts = products.filter(current => current.id !== id);
          setProducts(newProducts);
        } else {
          const newProducts = products.map(current => {
            if (current.id === id) {
              return { ...current, quantity: current.quantity - 1 };
            }
            return current;
          });

          setProducts(newProducts);
        }
      }
      await AsyncStorage.setItem('@GoBarber/cart', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
