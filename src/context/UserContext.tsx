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
  loadingUser: boolean;
  users: UserType[];
  usersLoading: boolean;
  loadUsersList: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[] | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const setUserContext = (user: UserType) => {
    setUser(user);
  };

  const clearUserContext = () => {
    setUser(null);
  };

  const loadUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const response = await axiosInstance.get("/users/me/");
      setUser(response.data);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const loadUsersList = useCallback(async () => {
    setUsersLoading(true);
    axiosInstance
      .get<UserType[]>("/users/user-list/")
      .then((res) => {
        setUsers(res.data.filter((u) => u.role === "athlete"));
      })
      .finally(() => setUsersLoading(false));
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUserContext,
        clearUserContext,
        loadUser,
        loadingUser,
        users,
        usersLoading,
        loadUsersList,
      }}
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
