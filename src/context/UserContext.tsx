import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import axiosInstance from "../api/axiosInstance";

export interface UserType {
  id: number;
  email: string;
  username: string;
  role: "admin" | "athlete";
  last_login: string;
  date_joined?: string;
}

export interface UserContextType {
  user: UserType | null;
  setUserContext: (user: UserType) => void;
  clearUserContext: () => void;
  loadUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);

  const setUserContext = (user: UserType) => {
    setUser(user);
  };

  const clearUserContext = () => {
    setUser(null);
  };

  const loadUser = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/users/me/");
      setUser(response.data);
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  return (
    <UserContext.Provider
      value={{ user, setUserContext, clearUserContext, loadUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUserContext must be used within a UserProvider");
  return context;
};
