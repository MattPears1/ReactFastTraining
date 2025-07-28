import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Filter, Download, Mail, Users } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@contexts/ToastContext";
import { adminDashboardApi } from "@services/api/admin-dashboard.service";
import { Client, FilterState, SortState } from "./types";
import { ClientsTable } from "./components/ClientsTable";
import { ClientsFilters } from "./components/ClientsFilters";
import { ClientProfileModal } from "./components/ClientProfileModal";
import { ClientsPagination } from "./components/ClientsPagination";

export const AdminClientsPage: React.FC = () => {
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const itemsPerPage = 20;

  // Filter and sort state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    hasBookings: "all",
    dateFrom: "",
    dateTo: "",
    minSpend: "",
  });

  const [sort, setSort] = useState<SortState>({
    field: "name",
    direction: "asc",
  });

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);

      // Mock data for now - replace with actual API call
      const mockClients: Client[] = [
        {
          id: "1",
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "07700 900000",
          address: "123 Main St, Leeds, LS1 1AA",
          createdAt: "2024-01-15T10:00:00Z",
          stats: {
            bookingCount: 5,
            totalSpend: 375,
            lastBookingDate: "2024-03-01T09:00:00Z",
            completedCourses: 4,
            upcomingBookings: 1,
          },
          specialRequirements: ["Vegetarian lunch option"],
        },
        {
          id: "2",
          name: "Sarah Johnson",
          email: "sarah.j@example.com",
          phone: "07700 900001",
          createdAt: "2024-02-20T14:30:00Z",
          stats: {
            bookingCount: 3,
            totalSpend: 225,
            lastBookingDate: "2024-02-25T14:00:00Z",
            completedCourses: 3,
            upcomingBookings: 0,
          },
        },
        {
          id: "3",
          name: "Emma Wilson",
          email: "emma.wilson@example.com",
          createdAt: "2024-03-10T09:15:00Z",
          stats: {
            bookingCount: 0,
            totalSpend: 0,
            completedCourses: 0,
            upcomingBookings: 0,
          },
        },
      ];

      setClients(mockClients);
      setTotalClients(mockClients.length);
      setTotalPages(Math.ceil(mockClients.length / itemsPerPage));
    } catch (error) {
      showToast("Failed to load clients", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filtered and sorted clients
  const filteredClients = useMemo(() => {
    let filtered = [...clients];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          (client.phone && client.phone.includes(filters.search)),
      );
    }

    // Apply booking status filter
    if (filters.hasBookings !== "all") {
      filtered = filtered.filter((client) => {
        if (filters.hasBookings === "active") {
          return client.stats.upcomingBookings > 0;
        } else if (filters.hasBookings === "inactive") {
          return (
            client.stats.bookingCount > 0 && client.stats.upcomingBookings === 0
          );
        } else if (filters.hasBookings === "none") {
          return client.stats.bookingCount === 0;
        }
        return true;
      });
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (client) => new Date(client.createdAt) >= new Date(filters.dateFrom),
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (client) => new Date(client.createdAt) <= new Date(filters.dateTo),
      );
    }

    // Apply minimum spend filter
    if (filters.minSpend) {
      const minSpend = parseFloat(filters.minSpend);
      filtered = filtered.filter(
        (client) => client.stats.totalSpend >= minSpend,
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "lastBooking":
          const aDate = a.stats.lastBookingDate
            ? new Date(a.stats.lastBookingDate).getTime()
            : 0;
          const bDate = b.stats.lastBookingDate
            ? new Date(b.stats.lastBookingDate).getTime()
            : 0;
          comparison = aDate - bDate;
          break;
        case "totalSpend":
          comparison = a.stats.totalSpend - b.stats.totalSpend;
          break;
        case "bookingCount":
          comparison = a.stats.bookingCount - b.stats.bookingCount;
          break;
      }

      return sort.direction === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [clients, filters, sort]);

  // Check for client ID in URL
  useEffect(() => {
    if (clientId && filteredClients.length > 0) {
      const client = filteredClients.find((c) => c.id === clientId);
      if (client) {
        setSelectedClient(client);
        setShowProfileModal(true);
      }
    }
  }, [clientId, filteredClients]);

  // Handler functions
  const handleSelectClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId],
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === paginatedClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(paginatedClients.map((c) => c.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      switch (action) {
        case "email":
          // Implement bulk email
          showToast(
            `Sending email to ${selectedClients.length} clients...`,
            "info",
          );
          break;
        case "export":
          handleExport(selectedClients);
          break;
        case "delete":
          // Implement bulk delete with confirmation
          showToast("Delete functionality not implemented", "info");
          break;
      }
    } catch (error) {
      showToast("Failed to perform bulk action", "error");
    }
  };

  const handleExport = async (clientIds?: string[]) => {
    try {
      const dataToExport = clientIds
        ? clients.filter((c) => clientIds.includes(c.id))
        : filteredClients;

      // Implement CSV export
      showToast(`Exporting ${dataToExport.length} clients...`, "info");
    } catch (error) {
      showToast("Failed to export clients", "error");
    }
  };

  const handleSort = (field: SortState["field"]) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowProfileModal(true);
    navigate(`/admin/clients/${client.id}`);
  };

  const handleCloseModal = () => {
    setShowProfileModal(false);
    setSelectedClient(null);
    navigate("/admin/clients");
  };

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPage]);

  // Count active and inactive clients
  const activeClientsCount = clients.filter(
    (c) => c.stats.upcomingBookings > 0,
  ).length;
  const inactiveClientsCount = clients.filter(
    (c) => c.stats.bookingCount > 0 && c.stats.upcomingBookings === 0,
  ).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Clients</h1>
        <p className="text-gray-600">
          Manage your client database and communications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Clients
              </p>
              <p className="text-2xl font-bold text-green-600">
                {activeClientsCount}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Inactive Clients
              </p>
              <p className="text-2xl font-bold text-gray-500">
                {inactiveClientsCount}
              </p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                New This Month
              </p>
              <p className="text-2xl font-bold text-primary-600">
                {
                  clients.filter((c) => {
                    const clientDate = new Date(c.createdAt);
                    const now = new Date();
                    return (
                      clientDate.getMonth() === now.getMonth() &&
                      clientDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
            <Users className="h-8 w-8 text-primary-400" />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedClients.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkAction("email")}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <Mail className="h-4 w-4" />
                  Email ({selectedClients.length})
                </button>
                <button
                  onClick={() => handleBulkAction("export")}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </>
            )}

            <button
              onClick={() => handleExport()}
              className="flex items-center gap-2 px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4" />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <ClientsFilters
          filters={filters}
          onFilterChange={setFilters}
          onClose={() => setShowFilters(false)}
          totalClients={totalClients}
          activeClientsCount={activeClientsCount}
          inactiveClientsCount={inactiveClientsCount}
        />
      )}

      {/* Clients Table */}
      <ClientsTable
        clients={paginatedClients}
        selectedClients={selectedClients}
        onSelectClient={handleSelectClient}
        onSelectAll={handleSelectAll}
        onClientClick={handleClientClick}
        sort={sort}
        onSort={handleSort}
        loading={loading}
      />

      {/* Pagination */}
      <ClientsPagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredClients.length / itemsPerPage)}
        totalItems={filteredClients.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Profile Modal */}
      {showProfileModal && selectedClient && (
        <ClientProfileModal
          client={selectedClient}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
