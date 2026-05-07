const bearerSecurity = [{ bearerAuth: [] }];

const errorResponse = {
  description: 'Error response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

const idParam = (name, description) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', format: 'int64', example: 1 },
});

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'InventoryHouse API',
    version: '1.0.0',
    description: [
      'Documentation REST pour construire une app mobile InventoryHouse.',
      'Parcours mobile recommande: creer un compte, se connecter, creer une maison, ajouter des membres existants, recuperer les references, puis gerer les items par maison.',
      'Pour un comportement quasi temps reel sans WebSocket, l app mobile peut relire GET /api/houses/{houseId}/items et interroger GET /api/houses/{houseId}/stock-movements?since=... apres chaque synchronisation.',
      'La deconnexion est stateless: le client mobile supprime le token JWT.',
    ].join('\n\n'),
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Serveur local',
    },
    {
      url: 'https://your-project.vercel.app',
      description: 'Remplacer par le domaine Vercel de production',
    },
  ],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Houses' },
    { name: 'Members' },
    { name: 'Stock' },
    { name: 'References' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Verifier que l API repond',
        responses: {
          200: {
            description: 'API up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Creer un compte utilisateur',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Compte cree',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: errorResponse,
          409: errorResponse,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Connexion reussie',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
        },
      },
    },
    '/api/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter avec Google',
        description: 'L app mobile recupere un idToken via Google Sign-In, puis l envoie ici. Le backend verifie ce token avec GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_IDS et renvoie le JWT InventoryHouse.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoogleLoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Connexion Google reussie',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
          500: errorResponse,
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Recuperer le profil connecte',
        security: bearerSecurity,
        responses: {
          200: {
            description: 'Profil utilisateur',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          401: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Se deconnecter cote mobile',
        description: 'JWT stateless: l API confirme, puis le client supprime son token local.',
        security: bearerSecurity,
        responses: {
          200: {
            description: 'Deconnexion acceptee',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Logged out successfully. Discard the token on the mobile client.',
                    },
                  },
                },
              },
            },
          },
          401: errorResponse,
        },
      },
    },
    '/api/houses': {
      get: {
        tags: ['Houses'],
        summary: 'Lister les maisons de l utilisateur',
        security: bearerSecurity,
        responses: {
          200: {
            description: 'Maisons accessibles',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    houses: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/House' },
                    },
                  },
                },
              },
            },
          },
          401: errorResponse,
        },
      },
      post: {
        tags: ['Houses'],
        summary: 'Creer une maison',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateHouseRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Maison creee',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { house: { $ref: '#/components/schemas/House' } },
                },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
        },
      },
    },
    '/api/houses/{houseId}': {
      get: {
        tags: ['Houses'],
        summary: 'Recuperer une maison',
        security: bearerSecurity,
        parameters: [idParam('houseId', 'Identifiant de la maison')],
        responses: {
          200: {
            description: 'Maison',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { house: { $ref: '#/components/schemas/House' } },
                },
              },
            },
          },
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
      patch: {
        tags: ['Houses'],
        summary: 'Modifier une maison',
        description: 'Reserve aux roles owner et admin.',
        security: bearerSecurity,
        parameters: [idParam('houseId', 'Identifiant de la maison')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateHouseRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Maison modifiee',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { house: { $ref: '#/components/schemas/House' } },
                },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
      delete: {
        tags: ['Houses'],
        summary: 'Supprimer une maison',
        description: 'Reserve au createur initial de la maison.',
        security: bearerSecurity,
        parameters: [idParam('houseId', 'Identifiant de la maison')],
        responses: {
          200: { $ref: '#/components/responses/MessageResponse' },
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/api/houses/{houseId}/members': {
      get: {
        tags: ['Members'],
        summary: 'Lister les membres d une maison',
        security: bearerSecurity,
        parameters: [idParam('houseId', 'Identifiant de la maison')],
        responses: {
          200: {
            description: 'Membres',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    members: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Member' },
                    },
                  },
                },
              },
            },
          },
          401: errorResponse,
          403: errorResponse,
        },
      },
      post: {
        tags: ['Members'],
        summary: 'Ajouter un membre existant',
        description: 'Le membre doit deja avoir un compte. Reserve aux roles owner et admin.',
        security: bearerSecurity,
        parameters: [idParam('houseId', 'Identifiant de la maison')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddMemberRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Membre ajoute',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { member: { $ref: '#/components/schemas/Member' } },
                },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
          409: errorResponse,
        },
      },
    },
    '/api/houses/{houseId}/members/{userId}': {
      patch: {
        tags: ['Members'],
        summary: 'Changer le role d un membre',
        description: 'Role cible: member ou admin. Le role owner ne se change pas ici.',
        security: bearerSecurity,
        parameters: [
          idParam('houseId', 'Identifiant de la maison'),
          idParam('userId', 'Identifiant de l utilisateur membre'),
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateMemberRoleRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Membre modifie',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { member: { $ref: '#/components/schemas/Member' } },
                },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
      delete: {
        tags: ['Members'],
        summary: 'Retirer un membre',
        description: 'Le role owner ne peut pas etre retire par cet endpoint.',
        security: bearerSecurity,
        parameters: [
          idParam('houseId', 'Identifiant de la maison'),
          idParam('userId', 'Identifiant de l utilisateur membre'),
        ],
        responses: {
          200: { $ref: '#/components/responses/MessageResponse' },
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/api/houses/{houseId}/items': {
      get: {
        tags: ['Stock'],
        summary: 'Lister le stock d une maison',
        security: bearerSecurity,
        parameters: [
          idParam('houseId', 'Identifiant de la maison'),
          {
            name: 'location_id',
            in: 'query',
            required: false,
            schema: { type: 'integer', format: 'int64' },
            description: 'Filtrer par emplacement seed: frigo, congelateur, placard.',
          },
          {
            name: 'category_id',
            in: 'query',
            required: false,
            schema: { type: 'integer', format: 'int64' },
          },
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'updated_since',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          200: {
            description: 'Items',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Item' },
                    },
                  },
                },
              },
            },
          },
          401: errorResponse,
          403: errorResponse,
        },
      },
      post: {
        tags: ['Stock'],
        summary: 'Ajouter un item au stock',
        security: bearerSecurity,
        parameters: [idParam('houseId', 'Identifiant de la maison')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateItemRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Item cree',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { item: { $ref: '#/components/schemas/Item' } },
                },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
          403: errorResponse,
        },
      },
    },
    '/api/houses/{houseId}/items/{itemId}': {
      get: {
        tags: ['Stock'],
        summary: 'Recuperer un item',
        security: bearerSecurity,
        parameters: [
          idParam('houseId', 'Identifiant de la maison'),
          idParam('itemId', 'Identifiant de l item'),
        ],
        responses: {
          200: {
            description: 'Item',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { item: { $ref: '#/components/schemas/Item' } },
                },
              },
            },
          },
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
      patch: {
        tags: ['Stock'],
        summary: 'Modifier un item',
        description: 'Toute modification cree un mouvement de stock avec action update.',
        security: bearerSecurity,
        parameters: [
          idParam('houseId', 'Identifiant de la maison'),
          idParam('itemId', 'Identifiant de l item'),
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateItemRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Item modifie',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { item: { $ref: '#/components/schemas/Item' } },
                },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
      delete: {
        tags: ['Stock'],
        summary: 'Supprimer un item du stock',
        description: 'L item est soft-delete pour conserver l historique des mouvements.',
        security: bearerSecurity,
        parameters: [
          idParam('houseId', 'Identifiant de la maison'),
          idParam('itemId', 'Identifiant de l item'),
        ],
        responses: {
          200: { $ref: '#/components/responses/MessageResponse' },
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/api/houses/{houseId}/stock-movements': {
      get: {
        tags: ['Stock'],
        summary: 'Lister les mouvements de stock',
        description: 'Utile pour synchroniser les ecrans mobile avec un polling depuis le dernier timestamp connu.',
        security: bearerSecurity,
        parameters: [
          idParam('houseId', 'Identifiant de la maison'),
          {
            name: 'since',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'action',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['add', 'update', 'remove'] },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
          },
        ],
        responses: {
          200: {
            description: 'Mouvements',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    stock_movements: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/StockMovement' },
                    },
                  },
                },
              },
            },
          },
          401: errorResponse,
          403: errorResponse,
        },
      },
    },
    '/api/references': {
      get: {
        tags: ['References'],
        summary: 'Recuperer locations et categories',
        responses: {
          200: {
            description: 'References',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReferencesResponse' },
              },
            },
          },
        },
      },
    },
    '/api/locations': {
      get: {
        tags: ['References'],
        summary: 'Lister les emplacements de stock',
        responses: {
          200: {
            description: 'Locations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    locations: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Reference' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/stock-categories': {
      get: {
        tags: ['References'],
        summary: 'Lister les categories de stock',
        responses: {
          200: {
            description: 'Categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    stock_categories: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Reference' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    responses: {
      MessageResponse: {
        description: 'Message',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { message: { type: 'string' } },
            },
          },
        },
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid credentials' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Alex Martin' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          password: { type: 'string', minLength: 8, example: 'secret123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          password: { type: 'string', example: 'secret123' },
        },
      },
      GoogleLoginRequest: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: {
            type: 'string',
            description: 'Google ID token retourne par Google Sign-In cote mobile.',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string', description: 'JWT a envoyer en Authorization: Bearer <token>' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', format: 'int64', example: 1 },
          name: { type: 'string', nullable: true, example: 'Alex Martin' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          auth_provider: { type: 'string', enum: ['local', 'google'], example: 'local' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateHouseRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Maison principale' },
          type: { type: 'string', example: 'home' },
        },
      },
      UpdateHouseRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Appartement Lyon' },
          type: { type: 'string', example: 'colocation' },
        },
      },
      House: {
        type: 'object',
        properties: {
          id: { type: 'integer', format: 'int64', example: 1 },
          name: { type: 'string', example: 'Maison principale' },
          type: { type: 'string', example: 'home' },
          created_by: { type: 'integer', format: 'int64', example: 1 },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          role: { type: 'string', nullable: true, enum: ['owner', 'admin', 'member'] },
          joined_at: { type: 'string', format: 'date-time', nullable: true },
          counts: {
            type: 'object',
            properties: {
              members: { type: 'integer', example: 3 },
              items: { type: 'integer', example: 42 },
            },
          },
        },
      },
      AddMemberRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'member@example.com' },
          role: { type: 'string', enum: ['member', 'admin'], default: 'member' },
        },
      },
      UpdateMemberRoleRequest: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['member', 'admin'], example: 'admin' },
        },
      },
      Member: {
        type: 'object',
        properties: {
          user_id: { type: 'integer', format: 'int64', example: 2 },
          house_id: { type: 'integer', format: 'int64', example: 1 },
          joined_at: { type: 'string', format: 'date-time' },
          role: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer', format: 'int64', example: 2 },
              name: { type: 'string', enum: ['owner', 'admin', 'member'], example: 'member' },
            },
          },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Reference: {
        type: 'object',
        properties: {
          id: { type: 'integer', format: 'int64', example: 1 },
          name: { type: 'string', example: 'frigo' },
        },
      },
      ReferencesResponse: {
        type: 'object',
        properties: {
          locations: {
            type: 'array',
            items: { $ref: '#/components/schemas/Reference' },
          },
          stock_categories: {
            type: 'array',
            items: { $ref: '#/components/schemas/Reference' },
          },
        },
      },
      CreateItemRequest: {
        type: 'object',
        required: ['category_id', 'location_id', 'name', 'unit'],
        properties: {
          category_id: { type: 'integer', format: 'int64', example: 1 },
          location_id: { type: 'integer', format: 'int64', example: 1 },
          name: { type: 'string', example: 'Yaourts nature' },
          quantity: { type: 'integer', minimum: 0, default: 0, example: 6 },
          unit: { type: 'string', example: 'piece' },
          expiration_date: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      UpdateItemRequest: {
        type: 'object',
        properties: {
          category_id: { type: 'integer', format: 'int64', example: 1 },
          location_id: { type: 'integer', format: 'int64', example: 2 },
          name: { type: 'string', example: 'Yaourts nature' },
          quantity: { type: 'integer', minimum: 0, example: 4 },
          unit: { type: 'string', example: 'piece' },
          expiration_date: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Item: {
        type: 'object',
        properties: {
          id: { type: 'integer', format: 'int64', example: 1 },
          house_id: { type: 'integer', format: 'int64', example: 1 },
          category_id: { type: 'integer', format: 'int64', example: 1 },
          location_id: { type: 'integer', format: 'int64', example: 1 },
          name: { type: 'string', example: 'Yaourts nature' },
          quantity: { type: 'integer', example: 6 },
          unit: { type: 'string', example: 'piece' },
          expiration_date: { type: 'string', format: 'date-time', nullable: true },
          created_by: { type: 'integer', format: 'int64', example: 1 },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          deleted_at: { type: 'string', format: 'date-time', nullable: true },
          category: { $ref: '#/components/schemas/Reference' },
          location: { $ref: '#/components/schemas/Reference' },
          created_by_user: { $ref: '#/components/schemas/User' },
        },
      },
      StockMovement: {
        type: 'object',
        properties: {
          id: { type: 'integer', format: 'int64', example: 1 },
          item_id: { type: 'integer', format: 'int64', example: 1 },
          user_id: { type: 'integer', format: 'int64', example: 1 },
          house_id: { type: 'integer', format: 'int64', example: 1 },
          change_quantity: { type: 'integer', example: -2 },
          action: { type: 'string', enum: ['add', 'update', 'remove'], example: 'update' },
          created_at: { type: 'string', format: 'date-time' },
          item: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer', format: 'int64', example: 1 },
              name: { type: 'string', example: 'Yaourts nature' },
              unit: { type: 'string', example: 'piece' },
              deleted_at: { type: 'string', format: 'date-time', nullable: true },
            },
          },
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
};
