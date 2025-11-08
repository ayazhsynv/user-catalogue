import { useState, useEffect, useMemo } from "react";
import "./App.css";
import { fetchUsers } from "./api/users";
import { createUser } from "./api/users";
import { deleteUser } from "./api/users";
import { updateUser } from "./api/users";

const COLUMNS = ["name", "email", "role"];

function App() {
  // States
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "user" });
  const [editingUser, setEditingUser] = useState(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);

  // Sort state (generic)
  const [sortKey, setSortKey] = useState("name"); // "name" | "email" | "role"
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  // Fetch users on query change
  useEffect(() => {
    let ignore = false;
    const timeout = setTimeout(() => {
      (async () => {
        setLoading(true);
        setError("");
        try {
          const data = await fetchUsers(query);
          if (!ignore) setUsers(data);
        } catch (e) {
          if (!ignore) setError(e.message || "Failed to load");
        } finally {
          if (!ignore) setLoading(false);
        }
      })();
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [query]);

  // Filtered rows
  const q = query.trim().toLowerCase();
  const rows = q
    ? users.filter((u) =>
        COLUMNS.some((f) =>
          String(u[f] ?? "")
            .toLowerCase()
            .includes(q)
        )
      )
    : users;

  // Sorting
  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  // Sorted rows
  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const aVal = String(a?.[sortKey] ?? "");
      const bVal = String(b?.[sortKey] ?? "");
      const cmp = collator.compare(aVal, bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir, collator]);

  // Sort handler
  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Modal handlers
  const openModal = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", role: "user" });
    setFormError("");
    setIsModalOpen(true);
  };
  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
  };

  // Edit Modal handlers
  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "user",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Delete Modal handlers
  const openDelete = (user) => {
    setUserToDelete(user);
    setDeleteError("");
    setIsDeleteOpen(true);
  };
  const closeDelete = () => {
    if (deleting) return;
    setIsDeleteOpen(false);
  };
  async function confirmDelete() {
    if (!userToDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setIsDeleteOpen(false);
    } catch (e) {
      setDeleteError(e.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  // Add/Edit user
  async function handleAddOrEditUser(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      let saved;
      if (editingUser) {
        saved = await updateUser(editingUser.id, form);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? saved : u))
        );
      } else {
        saved = await createUser(form);
        setUsers((prev) => [saved, ...prev]);
      }
      setIsModalOpen(false);
    } catch (e) {
      setFormError(
        e.message ||
          (editingUser ? "Failed to update user" : "Failed to add user")
      );
    } finally {
      setSaving(false);
    }
  }

  // Render
  return (
    <div className="App">
      <h1>User Catalogue</h1>
      <div className="UserSearch">
        <input
          type="search"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <table className="UserTable">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th
                key={c}
                onClick={() => handleSort(c)}
                className="sortable"
                aria-sort={
                  sortKey === c
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}{" "}
                {sortKey === c ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={COLUMNS.length + 1}>Loading...</td>
            </tr>
          )}
          {error && (
            <tr>
              <td colSpan={COLUMNS.length + 1} style={{ color: "red" }}>
                {error}
              </td>
            </tr>
          )}
          {!loading &&
            !error &&
            sortedRows.map((u) => (
              <tr key={u.id}>
                {COLUMNS.map((c) => (
                  <td key={c}>{u[c]}</td>
                ))}
                <td>
                  <button onClick={() => openEdit(u)}>Edit</button>{" "}
                  <button onClick={() => openDelete(u)}>Delete</button>
                </td>
              </tr>
            ))}
          {!loading && !error && sortedRows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length + 1}>No data</td>
            </tr>
          )}
        </tbody>
      </table>

      <button className="UserAddButton" onClick={openModal}>
        Add User
      </button>

      {/* Add / Edit User modal*/}
      {isModalOpen && (
        <div className="UserAddModalOverlay" onClick={closeModal}>
          <div
            className="UserAddModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="userModalTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="userModalTitle">
              {editingUser ? "Edit User" : "Add User"}
            </h2>
            <form onSubmit={handleAddOrEditUser} className="UserForm">
              <label>
                Name
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </label>
              <label>
                Role
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
              </label>

              {formError && <p className="FormError">{formError}</p>}

              <div className="ModalActions">
                <button type="button" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving
                    ? editingUser
                      ? "Saving..."
                      : "Saving..."
                    : editingUser
                    ? "Update"
                    : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {isDeleteOpen && (
        <div className="UserDeleteModalOverlay" onClick={closeDelete}>
          <div
            className="UserDeleteModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteUserTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="deleteUserTitle">Delete User</h2>
            <p>Are you sure you want to delete “{userToDelete?.name}”?</p>
            {deleteError && <p className="FormError">{deleteError}</p>}
            <div className="ModalActions">
              <button type="button" onClick={closeDelete} disabled={deleting}>
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
