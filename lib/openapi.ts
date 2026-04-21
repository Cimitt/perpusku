const errorResponse = {
  description: 'Error response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
}

const successResponse = {
  description: 'Success response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/SuccessResponse' },
    },
  },
}

const dataResponse = (description = 'Data response') => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/DataResponse' },
    },
  },
})

const jsonRequest = (schema: Record<string, unknown>) => ({
  required: true,
  content: {
    'application/json': { schema },
  },
})

const formDataRequest = (description: string) => ({
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description,
          },
        },
        required: ['file'],
      },
    },
  },
})

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'PerpuSmuhda Supabase API',
    version: '1.0.0',
    description:
      'Dokumentasi endpoint Next.js Route Handler yang membaca dan menulis data Supabase untuk sistem perpustakaan digital.',
  },
  servers: [
    {
      url: '/',
      description: 'Current deployment',
    },
  ],
  tags: [
    { name: 'Member', description: 'Endpoint area anggota perpustakaan' },
    { name: 'Admin', description: 'Endpoint area admin dan petugas' },
    { name: 'Feeds', description: 'Endpoint feed sosial anggota' },
    { name: 'Notifications', description: 'Endpoint email dan notifikasi' },
    { name: 'Webhooks', description: 'Endpoint integrasi webhook eksternal' },
    { name: 'Docs', description: 'Endpoint dokumentasi OpenAPI' },
  ],
  components: {
    securitySchemes: {
      ClerkSession: {
        type: 'apiKey',
        in: 'cookie',
        name: '__session',
        description: 'Session cookie Clerk untuk request dari aplikasi web.',
      },
      SvixWebhook: {
        type: 'apiKey',
        in: 'header',
        name: 'svix-signature',
        description: 'Signature webhook Clerk yang diverifikasi dengan Svix.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Unauthorized' },
          details: { type: 'object', additionalProperties: true },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
        },
      },
      DataResponse: {
        type: 'object',
        properties: {
          data: {
            oneOf: [
              { type: 'array', items: { type: 'object', additionalProperties: true } },
              { type: 'object', additionalProperties: true },
            ],
          },
        },
      },
      BookInput: {
        type: 'object',
        properties: {
          judul_buku: { type: 'string', example: 'Laskar Pelangi' },
          id_kategori: { type: ['integer', 'null'], example: 1 },
          pengarang: { type: ['string', 'null'], example: 'Andrea Hirata' },
          penerbit: { type: ['string', 'null'], example: 'Bentang Pustaka' },
          tahun_terbit: { type: ['integer', 'null'], minimum: 1000, maximum: 9999 },
          isbn: { type: ['string', 'null'] },
          deskripsi_buku: { type: ['string', 'null'] },
          gambar_buku: { type: ['string', 'null'], format: 'uri' },
          stok: { type: 'integer', minimum: 0, default: 1 },
          stok_tersedia: { type: 'integer', minimum: 0, default: 1 },
        },
        required: ['judul_buku'],
      },
      CategoryInput: {
        type: 'object',
        properties: {
          nama_kategori: { type: 'string', example: 'Novel' },
        },
        required: ['nama_kategori'],
      },
      ReviewInput: {
        type: 'object',
        properties: {
          id_buku: { type: 'integer', example: 12 },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          ulasan: { type: 'string', example: 'Bukunya bagus dan mudah dipahami.' },
        },
        required: ['id_buku', 'rating'],
      },
      CheckoutInput: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id_buku: { type: 'integer', example: 10 },
                qty: { type: 'integer', minimum: 1, example: 1 },
              },
              required: ['id_buku'],
            },
          },
        },
        required: ['items'],
      },
      QrActionInput: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['borrow', 'return'], example: 'borrow' },
          qr_token: { type: 'string', example: 'qr-token' },
        },
        required: ['action', 'qr_token'],
      },
      FeedInput: {
        type: 'object',
        properties: {
          caption: { type: 'string', example: 'Rekomendasi buku minggu ini' },
          media: { type: 'string', format: 'binary' },
        },
        required: ['caption', 'media'],
      },
    },
  },
  security: [{ ClerkSession: [] }],
  paths: {
    '/api/docs': {
      get: {
        tags: ['Docs'],
        summary: 'OpenAPI JSON',
        security: [],
        responses: {
          '200': {
            description: 'OpenAPI specification',
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
    },
    '/api/member/me': {
      get: {
        tags: ['Member'],
        summary: 'Ambil profil anggota aktif dan auto-sync dari Clerk jika belum ada',
        'x-supabase': { tables: ['pengguna', 'anggota'] },
        responses: { '200': dataResponse(), '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/profile': {
      get: {
        tags: ['Member'],
        summary: 'Ambil profil anggota',
        'x-supabase': { tables: ['pengguna', 'anggota'] },
        responses: { '200': dataResponse(), '401': errorResponse, '404': errorResponse },
      },
      patch: {
        tags: ['Member'],
        summary: 'Perbarui profil anggota',
        'x-supabase': { tables: ['pengguna', 'anggota'] },
        requestBody: jsonRequest({ type: 'object', additionalProperties: true }),
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/catalog': {
      get: {
        tags: ['Member'],
        summary: 'Katalog buku anggota',
        'x-supabase': { tables: ['buku', 'kategori'] },
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Cari judul buku' },
          { name: 'category', in: 'query', schema: { type: 'integer' }, description: 'Filter ID kategori' },
        ],
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/categories': {
      get: {
        tags: ['Member'],
        summary: 'Daftar kategori buku',
        'x-supabase': { tables: ['kategori'] },
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/checkout': {
      post: {
        tags: ['Member'],
        summary: 'Buat transaksi peminjaman pending',
        'x-supabase': { tables: ['pengguna', 'anggota', 'transaksi', 'buku'] },
        requestBody: jsonRequest({ $ref: '#/components/schemas/CheckoutInput' }),
        responses: { '200': dataResponse(), '400': errorResponse, '401': errorResponse, '403': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/loans': {
      get: {
        tags: ['Member'],
        summary: 'Riwayat dan pinjaman anggota',
        'x-supabase': { tables: ['pengguna', 'anggota', 'transaksi', 'buku'] },
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter status transaksi' },
        ],
        responses: { '200': dataResponse(), '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
      patch: {
        tags: ['Member'],
        summary: 'Ajukan perpanjangan transaksi anggota',
        'x-supabase': { tables: ['transaksi'] },
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'integer' } }],
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '403': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/extend': {
      post: {
        tags: ['Member'],
        summary: 'Perpanjang masa pinjam berdasarkan QR token',
        'x-supabase': { tables: ['transaksi', 'pengguna', 'anggota'] },
        requestBody: jsonRequest({
          type: 'object',
          properties: { qr_token: { type: 'string' } },
          required: ['qr_token'],
        }),
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '403': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/overdue': {
      get: {
        tags: ['Member'],
        summary: 'Data keterlambatan dan denda anggota',
        'x-supabase': { tables: ['pengguna', 'anggota', 'transaksi'] },
        responses: { '200': dataResponse(), '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/reviews': {
      get: {
        tags: ['Member'],
        summary: 'Ambil ulasan buku anggota',
        'x-supabase': { tables: ['pengguna', 'anggota', 'ulasan_buku'] },
        parameters: [{ name: 'id_buku', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
      post: {
        tags: ['Member'],
        summary: 'Buat ulasan buku',
        'x-supabase': { tables: ['ulasan_buku'] },
        requestBody: jsonRequest({ $ref: '#/components/schemas/ReviewInput' }),
        responses: { '201': dataResponse(), '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
      delete: {
        tags: ['Member'],
        summary: 'Hapus ulasan anggota',
        'x-supabase': { tables: ['ulasan_buku'] },
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'integer' } }],
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/return-qr': {
      get: {
        tags: ['Member'],
        summary: 'Validasi QR transaksi anggota',
        'x-supabase': { tables: ['transaksi', 'buku', 'anggota'] },
        parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': dataResponse(), '400': errorResponse, '401': errorResponse, '404': errorResponse },
      },
      post: {
        tags: ['Member'],
        summary: 'Proses borrow/return dengan QR token',
        'x-supabase': { tables: ['transaksi', 'buku'] },
        requestBody: jsonRequest({ $ref: '#/components/schemas/QrActionInput' }),
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/member/avatar': {
      post: {
        tags: ['Member'],
        summary: 'Upload avatar anggota ke Supabase Storage',
        'x-supabase': { storageBuckets: ['book-covers'] },
        requestBody: formDataRequest('Avatar JPG, PNG, atau WebP maksimal 5 MB'),
        responses: { '201': dataResponse('URL avatar'), '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/books': {
      get: {
        tags: ['Admin'],
        summary: 'Kelola daftar buku',
        'x-supabase': { tables: ['buku', 'kategori'] },
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'integer' } },
          { name: 'categoryId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
      post: {
        tags: ['Admin'],
        summary: 'Tambah buku',
        'x-supabase': { tables: ['buku'] },
        requestBody: jsonRequest({ $ref: '#/components/schemas/BookInput' }),
        responses: { '201': dataResponse(), '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Perbarui buku',
        'x-supabase': { tables: ['buku'] },
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'integer' } }],
        requestBody: jsonRequest({ $ref: '#/components/schemas/BookInput' }),
        responses: { '200': dataResponse(), '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Hapus buku',
        'x-supabase': { tables: ['buku'] },
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'integer' } }],
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '409': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/categories': {
      get: {
        tags: ['Admin'],
        summary: 'Daftar kategori',
        'x-supabase': { tables: ['kategori'] },
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
      post: {
        tags: ['Admin'],
        summary: 'Tambah kategori',
        'x-supabase': { tables: ['kategori'] },
        requestBody: jsonRequest({ $ref: '#/components/schemas/CategoryInput' }),
        responses: { '201': dataResponse(), '400': errorResponse, '401': errorResponse, '409': errorResponse, '500': errorResponse },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Perbarui kategori',
        'x-supabase': { tables: ['kategori'] },
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'integer' } }],
        requestBody: jsonRequest({ $ref: '#/components/schemas/CategoryInput' }),
        responses: { '200': dataResponse(), '400': errorResponse, '401': errorResponse, '409': errorResponse, '500': errorResponse },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Hapus kategori',
        'x-supabase': { tables: ['kategori'] },
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'integer' } }],
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Statistik dashboard admin',
        'x-supabase': { tables: ['v_statistik_dashboard', 'kategori', 'transaksi'] },
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/members': {
      get: {
        tags: ['Admin'],
        summary: 'Daftar dan statistik anggota',
        'x-supabase': { tables: ['pengguna', 'anggota'] },
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Perbarui status/password anggota',
        'x-supabase': { tables: ['pengguna'] },
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'integer' } }],
        requestBody: jsonRequest({ type: 'object', additionalProperties: true }),
        responses: { '200': dataResponse(), '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/upload': {
      post: {
        tags: ['Admin'],
        summary: 'Upload cover buku ke Supabase Storage',
        'x-supabase': { storageBuckets: ['book-covers'] },
        requestBody: formDataRequest('Cover JPG, PNG, atau WebP maksimal 5 MB'),
        responses: { '201': dataResponse('URL cover'), '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/qr': {
      get: {
        tags: ['Admin'],
        summary: 'Validasi QR transaksi untuk petugas',
        'x-supabase': { tables: ['transaksi', 'buku', 'anggota'] },
        parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': dataResponse(), '400': errorResponse, '401': errorResponse, '404': errorResponse, '409': errorResponse },
      },
      post: {
        tags: ['Admin'],
        summary: 'Proses transaksi borrow/return lewat QR',
        'x-supabase': { tables: ['transaksi', 'buku'] },
        requestBody: jsonRequest({ $ref: '#/components/schemas/QrActionInput' }),
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/fines': {
      get: {
        tags: ['Admin'],
        summary: 'Daftar denda anggota',
        'x-supabase': { tables: ['v_denda_per_anggota'] },
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Tandai denda lunas',
        'x-supabase': { tables: ['transaksi'] },
        requestBody: jsonRequest({
          type: 'object',
          properties: { id_transaksi: { type: 'integer' } },
          required: ['id_transaksi'],
        }),
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/fines/notify': {
      post: {
        tags: ['Notifications'],
        summary: 'Kirim email tagihan denda',
        'x-supabase': { tables: ['anggota', 'transaksi'] },
        requestBody: jsonRequest({ type: 'object', additionalProperties: true }),
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/reports': {
      get: {
        tags: ['Admin'],
        summary: 'Laporan transaksi, denda, atau katalog',
        'x-supabase': { tables: ['v_transaksi_aktif', 'v_denda_per_anggota', 'v_katalog_buku'] },
        parameters: [
          { name: 'type', in: 'query', required: true, schema: { type: 'string', enum: ['transactions', 'fines', 'books'] } },
        ],
        responses: { '200': dataResponse(), '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/reviews': {
      get: {
        tags: ['Admin'],
        summary: 'Moderasi ulasan buku',
        'x-supabase': { tables: ['ulasan_buku'] },
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Hapus ulasan buku',
        'x-supabase': { tables: ['ulasan_buku'] },
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'integer' } }],
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/feeds': {
      get: {
        tags: ['Admin'],
        summary: 'Daftar feed untuk moderasi',
        'x-supabase': { tables: ['feeds', 'feed_comments', 'feed_likes'] },
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Hapus feed atau komentar',
        'x-supabase': { tables: ['feeds', 'feed_comments', 'feed_likes'] },
        parameters: [
          { name: 'id', in: 'query', schema: { type: 'integer' }, description: 'ID feed' },
          { name: 'comment_id', in: 'query', schema: { type: 'integer' }, description: 'ID komentar' },
        ],
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/admin/transactions/overdue/whatsapp': {
      post: {
        tags: ['Notifications'],
        summary: 'Ambil nomor WhatsApp untuk tagihan keterlambatan',
        'x-supabase': { tables: ['transaksi', 'anggota'] },
        requestBody: jsonRequest({
          type: 'object',
          properties: { id_transaksi: { type: 'integer' } },
          required: ['id_transaksi'],
        }),
        responses: { '200': dataResponse(), '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/feeds': {
      get: {
        tags: ['Feeds'],
        summary: 'Daftar feed anggota',
        'x-supabase': { tables: ['feeds', 'pengguna', 'anggota', 'feed_likes'] },
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
      post: {
        tags: ['Feeds'],
        summary: 'Buat feed baru dengan media',
        'x-supabase': { tables: ['pengguna', 'anggota', 'feeds', 'feed_media'], storageBuckets: ['feed_media'] },
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/FeedInput' },
            },
          },
        },
        responses: { '201': dataResponse(), '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/feeds/{feedId}': {
      patch: {
        tags: ['Feeds'],
        summary: 'Perbarui caption feed milik anggota',
        'x-supabase': { tables: ['feeds', 'pengguna', 'anggota'] },
        parameters: [{ name: 'feedId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: jsonRequest({
          type: 'object',
          properties: { caption: { type: 'string' } },
          required: ['caption'],
        }),
        responses: { '200': dataResponse(), '400': errorResponse, '401': errorResponse, '403': errorResponse, '404': errorResponse, '500': errorResponse },
      },
      delete: {
        tags: ['Feeds'],
        summary: 'Hapus feed milik anggota',
        'x-supabase': { tables: ['feeds', 'feed_comments', 'feed_likes'], storageBuckets: ['feed_media'] },
        parameters: [{ name: 'feedId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': successResponse, '401': errorResponse, '403': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/feeds/{feedId}/like': {
      post: {
        tags: ['Feeds'],
        summary: 'Toggle like feed',
        'x-supabase': { tables: ['pengguna', 'anggota', 'feed_likes', 'feeds'] },
        parameters: [{ name: 'feedId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': dataResponse(), '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/feeds/{feedId}/comments': {
      get: {
        tags: ['Feeds'],
        summary: 'Daftar komentar feed',
        'x-supabase': { tables: ['feed_comments'] },
        parameters: [{ name: 'feedId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': dataResponse(), '401': errorResponse, '500': errorResponse },
      },
      post: {
        tags: ['Feeds'],
        summary: 'Tambah komentar feed',
        'x-supabase': { tables: ['pengguna', 'anggota', 'feed_comments'] },
        parameters: [{ name: 'feedId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: jsonRequest({
          type: 'object',
          properties: { comment: { type: 'string' } },
          required: ['comment'],
        }),
        responses: { '201': dataResponse(), '400': errorResponse, '401': errorResponse, '404': errorResponse, '500': errorResponse },
      },
    },
    '/api/send-email': {
      post: {
        tags: ['Notifications'],
        summary: 'Kirim email umum',
        requestBody: jsonRequest({ type: 'object', additionalProperties: true }),
        responses: { '200': successResponse, '400': errorResponse, '401': errorResponse, '500': errorResponse },
      },
    },
    '/api/webhooks/clerk': {
      post: {
        tags: ['Webhooks'],
        summary: 'Sinkronisasi user Clerk ke Supabase',
        security: [{ SvixWebhook: [] }],
        'x-supabase': { tables: ['pengguna', 'anggota'] },
        requestBody: jsonRequest({ type: 'object', additionalProperties: true }),
        responses: { '200': successResponse, '400': errorResponse, '500': errorResponse },
      },
    },
  },
} as const
