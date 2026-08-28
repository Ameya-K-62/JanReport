const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// LocalStorage keys - consistent across the app
const STORAGE_KEYS = {
  TOKEN: 'authorization',
  USER_TYPE: 'userType',
  USER_EMAIL: 'userEmail',
} as const;

// Helper function to get auth token
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

// Helper function to safely set localStorage item
const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

// Helper function to safely remove localStorage item
const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};

// Helper function to format timestamp
export const formatTimestamp = (timestamp: string | Date): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
};

export interface AnalyticsKpis {
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  rejectedReports: number;
  approvalRate: number;
  avgResolutionHours: number;
  previousPeriod: {
    totalReports: number;
    pendingReports: number;
    approvedReports: number;
    rejectedReports: number;
  };
}

export interface AnalyticsTimePoint {
  date: string;
  submitted: number;
  approved: number;
  rejected: number;
}

export interface AnalyticsCategoryPoint {
  category: string;
  count: number;
}

export interface AnalyticsPriorityPoint {
  priority: string;
  count: number;
}

export interface AnalyticsLocationPoint {
  location: string;
  count: number;
}

export interface AnalyticsResponseData {
  scope: 'user' | 'moderator';
  range: '7d' | '30d' | '90d' | '365d';
  filters: {
    status: 'all' | 'pending' | 'approved' | 'rejected';
    category: string;
  };
  kpis: AnalyticsKpis;
  timeSeries: AnalyticsTimePoint[];
  categoryBreakdown: AnalyticsCategoryPoint[];
  priorityBreakdown: AnalyticsPriorityPoint[];
  topLocations: AnalyticsLocationPoint[];
}

// API request helper
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// Auth API
export const authAPI = {
  signup: async (email: string, password: string, userType: 'user' | 'moderator') => {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    // Store token and user info - always set if token exists (no conditions)
    if (data.data?.token) {
      setStorageItem(STORAGE_KEYS.TOKEN, data.data.token);
      if (data.data.user?.userType) {
        setStorageItem(STORAGE_KEYS.USER_TYPE, data.data.user.userType);
      }
      if (data.data.user?.email) {
        setStorageItem(STORAGE_KEYS.USER_EMAIL, data.data.user.email);
      }
    } else {
      console.warn('No token received in signup response');
    }

    return data;
  },

  login: async (email: string, password: string, userType?: 'user' | 'moderator') => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store token and user info - always set if token exists (no conditions)
    if (data.data?.token) {
      setStorageItem(STORAGE_KEYS.TOKEN, data.data.token);
      if (data.data.user?.userType) {
        setStorageItem(STORAGE_KEYS.USER_TYPE, data.data.user.userType);
      }
      if (data.data.user?.email) {
        setStorageItem(STORAGE_KEYS.USER_EMAIL, data.data.user.email);
      }
    } else {
      console.warn('No token received in login response');
    }

    return data;
  },

  logout: () => {
    // Clear all auth-related data
    removeStorageItem(STORAGE_KEYS.TOKEN);
    removeStorageItem(STORAGE_KEYS.USER_TYPE);
    removeStorageItem(STORAGE_KEYS.USER_EMAIL);
  },

  getCurrentUser: () => {
    try {
      const token = getAuthToken();
      const userType = localStorage.getItem(STORAGE_KEYS.USER_TYPE);
      const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);

      // Return null if no token or userType
      if (!token || !userType) {
        // Clean up if token is missing but other data exists (inconsistent state)
        if (!token && (userType || userEmail)) {
          removeStorageItem(STORAGE_KEYS.USER_TYPE);
          removeStorageItem(STORAGE_KEYS.USER_EMAIL);
        }
        return null;
      }

      return {
        email: userEmail || null,
        userType: userType as 'user' | 'moderator',
        token,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
};

// Upload API
export const uploadAPI = {
  uploadImage: async (imageDataUrl: string) => {
    // Validate imageDataUrl format before sending
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      throw new Error('Invalid image data provided');
    }

    if (!imageDataUrl.startsWith('data:image/')) {
      console.error('Invalid image format. Expected data URL, got:', imageDataUrl.substring(0, 50));
      throw new Error('Invalid image format. Expected base64 data URL');
    }

    const base64Response = await apiRequest('/upload/image-base64', {
      method: 'POST',
      body: JSON.stringify({ imageDataUrl }),
    });

    const base64Data = await base64Response.json();
    if (base64Response.ok) {
      return base64Data;
    }

    console.warn('Base64 upload failed, retrying with multipart upload:', base64Data?.message || 'Unknown error');

    const token = getAuthToken();
    const blob = await (await fetch(imageDataUrl)).blob();
    const formData = new FormData();
    formData.append('image', blob, 'camera-capture.jpg');

    const multipartResponse = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const multipartData = await multipartResponse.json();
    if (!multipartResponse.ok) {
      throw new Error(
        multipartData.message ||
          base64Data?.message ||
          'Failed to upload image'
      );
    }

    return multipartData;
  },
};

// Reports API
export const reportsAPI = {
  submitReport: async (reportData: {
    title: string;
    description: string;
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    category: string;
    image?: string | null;
  }) => {
    const response = await apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit report');
    }

    return data;
  },

  getReports: async (page: number = 1, limit: number = 10, category?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category) {
      params.append('category', category);
    }

    const response = await apiRequest(`/reports?${params.toString()}`);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch reports');
    }

    // Transform data to match frontend format
    return {
      ...data,
      data: {
        ...data.data,
        reports: data.data.reports.map((report: any) => ({
          id: report.id,
          title: report.title,
          description: report.description,
          location: report.location,
          latitude: report.latitude ?? null,
          longitude: report.longitude ?? null,
          category: report.category,
          image: report.image || '',
          author: report.author?.split('@')[0] || 'anonymous',
          timestamp: formatTimestamp(report.timestamp),
          views: report.views || 0,
          likes: report.likes || 0,
          comments: report.comments || 0,
          status: report.status,
        })),
      },
    };
  },

  getPendingReports: async () => {
    const response = await apiRequest('/reports/pending');

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch pending reports');
    }

    return data;
  },

  getModerationReports: async (status: 'pending' | 'approved' | 'rejected') => {
    const response = await apiRequest(`/reports/moderation?status=${status}`);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch moderation reports');
    }

    return data;
  },

  updateReportStatus: async (
    reportId: string,
    status: 'approved' | 'rejected',
    rejectedReason?: string,
  ) => {
    const response = await apiRequest(`/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectedReason }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update report status');
    }

    return data;
  },

  getMyReports: async () => {
    const response = await apiRequest('/reports/mine');

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch your reports');
    }

    return {
      ...data,
      data: {
        reports: data.data.reports.map((report: any) => ({
          id: report.id,
          title: report.title,
          description: report.description,
          location: report.location,
          latitude: report.latitude ?? null,
          longitude: report.longitude ?? null,
          category: report.category,
          image: report.image || '',
          author: 'You',
          timestamp: formatTimestamp(report.timestamp),
          views: report.views || 0,
          likes: report.likes || 0,
          comments: report.comments || 0,
          status: report.status,
        })),
      },
    };
  },

  getReportById: async (id: string) => {
    const response = await apiRequest(`/reports/${id}`);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch report');
    }

    return {
      ...data,
      data: {
        report: {
          ...data.data.report,
          timestamp: formatTimestamp(data.data.report.timestamp),
        },
      },
    };
  },

  deleteReport: async (id: string) => {
    const response = await apiRequest(`/reports/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete report');
    }

    return data;
  },

  getAnalytics: async (
    scope: 'user' | 'moderator',
    range: '7d' | '30d' | '90d' | '365d' = '30d',
    status: 'all' | 'pending' | 'approved' | 'rejected' = 'all',
    category: string = 'all',
  ): Promise<{ success: boolean; data: AnalyticsResponseData }> => {
    const params = new URLSearchParams({
      scope,
      range,
      status,
      category,
    });

    const response = await apiRequest(`/reports/analytics?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch analytics');
    }

    return data;
  },
};
