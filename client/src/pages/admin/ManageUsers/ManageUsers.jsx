import { useEffect, useMemo, useState } from "react";
import { Trash2, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import Pagination from "../../../components/common/Pagination";
import SearchBar from "../../../components/common/SearchBar";
import Table from "../../../components/common/Table";
import { matchesQuery, paginate, totalPages } from "../../../utils/helpers";
import adminService from "../../../services/adminService";

const PER_PAGE = 5;

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.users();
      setUsers(data?.data || (Array.isArray(data) ? data : []));
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () => users.filter((user) => matchesQuery(user, query, ["id", "name", "email", "area"])),
    [users, query],
  );

  const pageCount = totalPages(filtered.length, PER_PAGE);
  const currentPage = Math.min(page, pageCount);
  const rows = paginate(filtered, currentPage, PER_PAGE);

  const removeUser = async (id) => {
    try {
      await adminService.deleteUser(id);
      setUsers((current) => current.filter((user) => user.id !== id));
      toast.success(`${id} removed successfully`);
    } catch (err) {
      toast.error(`Failed to remove ${id}`);
    }
  };

  const columns = [
    { key: "id", header: "ID", className: "font-mono text-xs" },
    { key: "name", header: "Name", className: "font-semibold" },
    { key: "email", header: "Email", className: "whitespace-nowrap text-muted-foreground" },
    { key: "role", header: "Role" },
    { key: "area", header: "Area", render: (row) => row.area || "-" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          className={
            row.status === "Active"
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    { key: "joined", header: "Joined", className: "whitespace-nowrap text-muted-foreground", render: (row) => row.joined || "-" },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            aria-label={`Delete ${row.name}`}
            onClick={() => removeUser(row.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Manage Users"
        description={loading ? "Loading users..." : `${users.length} users`}
      />
      <div className="soft-shadow rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <SearchBar
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Search users…"
            className="max-w-sm"
          />
        </div>

        <Table
          columns={columns}
          rows={rows}
          empty={<EmptyState icon={UsersIcon} title="No users found" className="m-4" />}
        />

        {filtered.length > 0 && (
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            total={filtered.length}
            perPage={PER_PAGE}
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
}
