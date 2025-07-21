import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import axiosInstance from "../../api/axiosInstance";
import Button from "../../components/ui/button/Button";
import { Eye, Upload, ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import NoUsersFound from "./components/NoUsersFound";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  last_login: string;
  date_joined: string;
};

type SortKey = "id" | "username" | "date_joined";
type SortOrder = "asc" | "desc";

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get<User[]>("/users/user-list/")
      .then((res) => {
        setUsers(res.data.filter((u) => u.role === "athlete"));
      })
      .finally(() => setLoading(false));
  }, []);

  const sortedUsers = [...users].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (sortKey === "date_joined") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return (
        <span className="flex flex-col ml-1">
          <ChevronUp className="w-3 h-3 -mb-1 text-gray-400" />
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </span>
      );
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Users List" path={["Users List"]} />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 flex-col">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="mt-3 text-gray-600 dark:text-gray-400">
                Loading Users...
              </span>
            </div>
          ) : sortedUsers.length === 0 ? (
            <NoUsersFound />
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <button
                      onClick={() => handleSort("id")}
                      className="flex items-center gap-1  cursor-pointer"
                    >
                      ID {renderSortIcon("id")}
                    </button>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider "
                  >
                    <button
                      onClick={() => handleSort("username")}
                      className="flex items-center gap-1  cursor-pointer"
                    >
                      Username {renderSortIcon("username")}
                    </button>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Email
                  </TableCell>
                  {/* <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <button
                      onClick={() => handleSort("date_joined")}
                      className="flex items-center gap-1  cursor-pointer"
                    >
                      Date Joined {renderSortIcon("date_joined")}
                    </button>
                  </TableCell> */}
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white text-start">
                      {user.id}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white text-start">
                      {user.username}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white text-start">
                      {user.email}
                    </TableCell>
                    {/* <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white text-start">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </TableCell> */}
                    <TableCell className="px-6 py-4 text-start">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            /* View Reports handler */
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View Reports
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            /* Upload File handler */
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" /> Upload File
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersList;
