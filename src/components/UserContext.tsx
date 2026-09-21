'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol_funcional: string;
}

export const INITIAL_USERS: UserProfile[] = [
  { id: 'P01', nombre: 'Mónica Freyre', email: 'monica.freyre@enfoque.io', rol_funcional: 'Arquitectura operativa' },
  { id: 'P02', nombre: 'Sandra Montes de Oca', email: 'sandra.montes.de.oca@enfoque.io', rol_funcional: 'Arquitectura comercial / cliente' },
  { id: 'P03', nombre: 'Karen Heitler', email: 'karen.heitler@enfoque.io', rol_funcional: 'Unidad cuantitativa' },
  { id: 'P04', nombre: 'José Antonio Turueño', email: 'jose.antonio.turueno@enfoque.io', rol_funcional: 'Arquitectura de oferta' },
  { id: 'P05', nombre: 'Andrei Jacinto', email: 'andrei.jacinto@enfoque.io', rol_funcional: 'Arquitectura de conocimiento' },
  { id: 'P06', nombre: 'Adolfo Villaverde', email: 'adolfo.villaverde@enfoque.io', rol_funcional: 'Arquitectura de negocio y finanzas' },
  { id: 'P07', nombre: 'Jesús Cabrera', email: 'jesus.cabrera@enfoque.io', rol_funcional: 'Dirección e integración digital' }
];

interface UserContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  availableUsers: UserProfile[];
}

const UserContext = createContext<UserContextType>({
  currentUser: INITIAL_USERS[3], // Default: José Antonio Turueño
  setCurrentUser: () => {},
  availableUsers: INITIAL_USERS
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[3]);

  useEffect(() => {
    const saved = localStorage.getItem('enfoque_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = INITIAL_USERS.find(u => u.id === parsed.id);
        if (match) setCurrentUser(match);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSetUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('enfoque_active_user', JSON.stringify(user));
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser: handleSetUser, availableUsers: INITIAL_USERS }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
