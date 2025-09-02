import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
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
import { Link } from "react-router";
import { useUserContext } from "../../context/UserContext";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import URLsList from "../../components/reports/URLsList";

type SortKey = "id" | "username" | "date_joined";
type SortOrder = "asc" | "desc";

const UsersList = () => {
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [URLSelectedUser, setURLSelectedUser] = useState<any>();
  const { isOpen, openModal, closeModal } = useModal();

  const { users, loadUsersList, usersLoading } = useUserContext();

  useEffect(() => {
    const fetchUsers = async () => {
      if (users === null) {
        await loadUsersList();
      }
    };

    fetchUsers();
  }, []);

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

  const sortedUsers = Array.isArray(users)
    ? [...users].sort((a, b) => {
        let aVal = a[sortKey];
        let bVal = b[sortKey];
        if (sortKey === "date_joined") {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      })
    : [];

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Users List" path={["Users List"]} />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          {usersLoading ? (
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
                    className="px-6  w-8 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
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
                    <TableCell className="px-6 py-4 text-start flex gap-2">
                      <Link to={`${user.id}/reports`} className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" /> Reports
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setURLSelectedUser(user);
                          openModal();
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Video URLs
                      </Button>
                      <Link
                        to={`${user.id}/upload-file`}
                        className="flex gap-2"
                      >
                        <Button
                          size="sm"
                          onClick={() => {
                            /* Upload File handler */
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" /> Upload File
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div>
          <Modal
            className="max-w-10/12 md:max-w-6/12 p-8 max-h-[90vh] overflow-y-auto"
            isOpen={isOpen}
            onClose={closeModal}
          >
            <URLsList
              URLSelectedUserId={URLSelectedUser?.id}
              selectedUserName={
                sortedUsers.find((user) => user.id === URLSelectedUser?.id)
                  ?.username
              }
            />
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default UsersList;
