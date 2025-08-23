/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_instagramContent from "../actions/instagramContent.js";
import type * as actions_tiktokContent from "../actions/tiktokContent.js";
import type * as actions_twitchContent from "../actions/twitchContent.js";
import type * as audioTranscriptActions from "../audioTranscriptActions.js";
import type * as bulkJobs from "../bulkJobs.js";
import type * as cleanupWebDocuments from "../cleanupWebDocuments.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as hunterActions from "../hunterActions.js";
import type * as hunterHttpEndpoints from "../hunterHttpEndpoints.js";
import type * as hunterMutations from "../hunterMutations.js";
import type * as hunterQueries from "../hunterQueries.js";
import type * as initializeHunter from "../initializeHunter.js";
import type * as jinaIntegration from "../jinaIntegration.js";
import type * as mutations_audioTranscripts from "../mutations/audioTranscripts.js";
import type * as mutations_callsPage from "../mutations/callsPage.js";
import type * as mutations_clearCachedTranscripts from "../mutations/clearCachedTranscripts.js";
import type * as mutations_instagramContent from "../mutations/instagramContent.js";
import type * as mutations_telephony from "../mutations/telephony.js";
import type * as mutations_tiktokContent from "../mutations/tiktokContent.js";
import type * as mutations_twitchContent from "../mutations/twitchContent.js";
import type * as mutations_youtubeContent from "../mutations/youtubeContent.js";
import type * as mutations_youtubeTranscripts from "../mutations/youtubeTranscripts.js";
import type * as proceduralAudio from "../proceduralAudio.js";
import type * as queries_audioTranscripts from "../queries/audioTranscripts.js";
import type * as queries_callsPage from "../queries/callsPage.js";
import type * as queries_debugYouTube from "../queries/debugYouTube.js";
import type * as queries_instagramContent from "../queries/instagramContent.js";
import type * as queries_telephony from "../queries/telephony.js";
import type * as queries_tiktokContent from "../queries/tiktokContent.js";
import type * as queries_twitchContent from "../queries/twitchContent.js";
import type * as queries_youtubeContent from "../queries/youtubeContent.js";
import type * as ragActions from "../ragActions.js";
import type * as ragMutations from "../ragMutations.js";
import type * as ragQueries from "../ragQueries.js";
import type * as ragSocialActions from "../ragSocialActions.js";
import type * as rateLimitHelpers from "../rateLimitHelpers.js";
import type * as scheduledFunctions from "../scheduledFunctions.js";
import type * as telephonyActions from "../telephonyActions.js";
import type * as testActions from "../testActions.js";
import type * as testSetup from "../testSetup.js";
import type * as voiceCloneJobs from "../voiceCloneJobs.js";
import type * as youtubeContentActions from "../youtubeContentActions.js";
import type * as youtubeTranscriptActions from "../youtubeTranscriptActions.js";
import type * as youtubeTranscripts from "../youtubeTranscripts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/instagramContent": typeof actions_instagramContent;
  "actions/tiktokContent": typeof actions_tiktokContent;
  "actions/twitchContent": typeof actions_twitchContent;
  audioTranscriptActions: typeof audioTranscriptActions;
  bulkJobs: typeof bulkJobs;
  cleanupWebDocuments: typeof cleanupWebDocuments;
  files: typeof files;
  http: typeof http;
  hunterActions: typeof hunterActions;
  hunterHttpEndpoints: typeof hunterHttpEndpoints;
  hunterMutations: typeof hunterMutations;
  hunterQueries: typeof hunterQueries;
  initializeHunter: typeof initializeHunter;
  jinaIntegration: typeof jinaIntegration;
  "mutations/audioTranscripts": typeof mutations_audioTranscripts;
  "mutations/callsPage": typeof mutations_callsPage;
  "mutations/clearCachedTranscripts": typeof mutations_clearCachedTranscripts;
  "mutations/instagramContent": typeof mutations_instagramContent;
  "mutations/telephony": typeof mutations_telephony;
  "mutations/tiktokContent": typeof mutations_tiktokContent;
  "mutations/twitchContent": typeof mutations_twitchContent;
  "mutations/youtubeContent": typeof mutations_youtubeContent;
  "mutations/youtubeTranscripts": typeof mutations_youtubeTranscripts;
  proceduralAudio: typeof proceduralAudio;
  "queries/audioTranscripts": typeof queries_audioTranscripts;
  "queries/callsPage": typeof queries_callsPage;
  "queries/debugYouTube": typeof queries_debugYouTube;
  "queries/instagramContent": typeof queries_instagramContent;
  "queries/telephony": typeof queries_telephony;
  "queries/tiktokContent": typeof queries_tiktokContent;
  "queries/twitchContent": typeof queries_twitchContent;
  "queries/youtubeContent": typeof queries_youtubeContent;
  ragActions: typeof ragActions;
  ragMutations: typeof ragMutations;
  ragQueries: typeof ragQueries;
  ragSocialActions: typeof ragSocialActions;
  rateLimitHelpers: typeof rateLimitHelpers;
  scheduledFunctions: typeof scheduledFunctions;
  telephonyActions: typeof telephonyActions;
  testActions: typeof testActions;
  testSetup: typeof testSetup;
  voiceCloneJobs: typeof voiceCloneJobs;
  youtubeContentActions: typeof youtubeContentActions;
  youtubeTranscriptActions: typeof youtubeTranscriptActions;
  youtubeTranscripts: typeof youtubeTranscripts;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rag: {
    chunks: {
      insert: FunctionReference<
        "mutation",
        "internal",
        {
          chunks: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entryId: string;
          startOrder: number;
        },
        { status: "pending" | "ready" | "replaced" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          entryId: string;
          order: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            metadata?: Record<string, any>;
            order: number;
            state: "pending" | "ready" | "replaced";
            text: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      replaceChunksPage: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        { nextStartOrder: number; status: "pending" | "ready" | "replaced" }
      >;
    };
    entries: {
      add: FunctionReference<
        "mutation",
        "internal",
        {
          allChunks?: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        {
          created: boolean;
          entryId: string;
          status: "pending" | "ready" | "replaced";
        }
      >;
      addAsync: FunctionReference<
        "mutation",
        "internal",
        {
          chunker: string;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        { created: boolean; entryId: string; status: "pending" | "ready" }
      >;
      deleteAsync: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        null
      >;
      deleteByKeyAsync: FunctionReference<
        "mutation",
        "internal",
        { beforeVersion?: number; key: string; namespaceId: string },
        null
      >;
      deleteByKeySync: FunctionReference<
        "action",
        "internal",
        { key: string; namespaceId: string },
        null
      >;
      deleteSync: FunctionReference<
        "action",
        "internal",
        { entryId: string },
        null
      >;
      findByContentHash: FunctionReference<
        "query",
        "internal",
        {
          contentHash: string;
          dimension: number;
          filterNames: Array<string>;
          key: string;
          modelId: string;
          namespace: string;
        },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { entryId: string },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          namespaceId?: string;
          order?: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { entryId: string },
        {
          replacedEntry: {
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          } | null;
        }
      >;
    };
    namespaces: {
      get: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | {
          createdAt: number;
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          namespaceId: string;
          status: "pending" | "ready" | "replaced";
          version: number;
        }
      >;
      getOrCreate: FunctionReference<
        "mutation",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          onComplete?: string;
          status: "pending" | "ready";
        },
        { namespaceId: string; status: "pending" | "ready" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      lookup: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | string
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { namespaceId: string },
        {
          replacedNamespace: null | {
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          };
        }
      >;
    };
    search: {
      search: FunctionReference<
        "action",
        "internal",
        {
          chunkContext?: { after: number; before: number };
          embedding: Array<number>;
          filters: Array<{ name: string; value: any }>;
          limit: number;
          modelId: string;
          namespace: string;
          vectorScoreThreshold?: number;
        },
        {
          entries: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          results: Array<{
            content: Array<{ metadata?: Record<string, any>; text: string }>;
            entryId: string;
            order: number;
            score: number;
            startOrder: number;
          }>;
        }
      >;
    };
  };
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
};
