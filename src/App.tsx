import { useState, useEffect } from 'react';

import { ContractDetails, SignerRole } from './types';

import {
  getStoredContracts,
  fetchContractsFromDatabase,
  saveContract,
  deleteContract,
  getContractByToken,
} from './services/storage';

import { AdminContractsList } from './components/AdminContractsList';
import { AdminCreateContract } from './components/AdminCreateContract';
import { AdminContractPreview } from './components/AdminContractPreview';
import { ClientSigningPage } from './components/ClientSigningPage';
import { downloadContractPdf } from './utils/pdfGenerator';
import { MilestoneLogo } from './components/MilestoneLogo';
import { MilestoneLocationProfile } from './components/MilestoneLocationProfile';
import { ExpiredLinkView } from './components/ExpiredLinkView';

import { MapPin } from 'lucide-react';

type AdminView =
  | 'list'
  | 'create'
  | 'preview'
  | 'location';

export default function App() {
  const [contracts, setContracts] = useState<
    ContractDetails[]
  >([]);

  const [activeView, setActiveView] =
    useState<AdminView>('list');

  const [selectedContract, setSelectedContract] =
    useState<ContractDetails | null>(null);

  const [editingContract, setEditingContract] =
    useState<ContractDetails | null>(null);

  // =========================================================
  // CLIENT SIGNING STATE
  // =========================================================

  const [clientToken, setClientToken] =
    useState<string | null>(null);

  const [clientContract, setClientContract] =
    useState<ContractDetails | null>(null);

  const [clientRole, setClientRole] =
    useState<SignerRole | null>(null);

  const [tokenError, setTokenError] =
    useState(false);

  // =========================================================
  // PARSE SIGNING TOKEN FROM URL
  // =========================================================

  const parseTokenFromUrl = () => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;

    /*
     * Supported:
     *
     * /sign/employer/TOKEN
     * /sign/worker/TOKEN
     *
     * #/sign/employer/TOKEN
     * #/sign/worker/TOKEN
     *
     * ?token=TOKEN
     * ?sign=TOKEN
     */

    const pathMatch = pathname.match(
      /\/sign\/(employer|worker)\/([^/?#]+)/
    );

    if (pathMatch) {
      return {
        roleHint: pathMatch[1] as SignerRole,
        token: pathMatch[2],
      };
    }

    const hashMatch = hash.match(
      /#\/sign\/(employer|worker)\/([^/?#]+)/
    );

    if (hashMatch) {
      return {
        roleHint: hashMatch[1] as SignerRole,
        token: hashMatch[2],
      };
    }

    const urlParams = new URLSearchParams(search);

    const token =
      urlParams.get('token') ||
      urlParams.get('sign');

    if (token) {
      const roleParam =
        urlParams.get('role') as
          | SignerRole
          | null;

      return {
        roleHint: roleParam || undefined,
        token,
      };
    }

    return null;
  };

  // =========================================================
  // INITIAL APP LOAD
  // =========================================================

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const parsed = parseTokenFromUrl();

        /*
         * ====================================================
         * SIGNING LINK
         * ====================================================
         */

        if (parsed?.token) {
          setClientToken(parsed.token);
          setClientContract(null);
          setClientRole(null);
          setTokenError(false);

          /*
           * Resolve the token from Google Sheets.
           */
          const match = await getContractByToken(
            parsed.token
          );

          if (match) {
            setClientContract(match.contract);

            setClientRole(
              parsed.roleHint || match.role
            );

            /*
             * Refresh admin cache in background.
             */
            fetchContractsFromDatabase()
              .then((loaded) => {
                setContracts(loaded);
              })
              .catch((error) => {
                console.error(
                  'Background contract refresh failed:',
                  error
                );
              });

            return;
          }

          /*
           * Token genuinely could not be resolved.
           */
          setTokenError(true);
          return;
        }

        /*
         * ====================================================
         * NORMAL ADMIN LOAD
         * ====================================================
         */

        const loaded =
          await fetchContractsFromDatabase();

        setContracts(loaded);
      } catch (error) {
        console.error(
          'Failed to initialize application:',
          error
        );

        const parsed = parseTokenFromUrl();

        if (parsed?.token) {
          setClientToken(parsed.token);
          setClientContract(null);
          setClientRole(null);
          setTokenError(true);
        } else {
          setContracts(getStoredContracts());
        }
      }
    };

    initializeApp();
  }, []);

  // =========================================================
  // OPEN CLIENT SIGNING PAGE
  // =========================================================

  const handleOpenClientSigning = async (
    token: string
  ) => {
    try {
      setTokenError(false);

      /*
       * Always resolve the token from the database.
       */
      const match = await getContractByToken(token);

      if (!match) {
        setClientToken(token);
        setClientContract(null);
        setClientRole(null);
        setTokenError(true);
        return;
      }

      /*
       * Use ONE stable signing URL format.
       *
       * Example:
       * https://yourapp.vercel.app/?token=emp_xxxxx
       */
      const newUrl =
        `${window.location.origin}/?token=${encodeURIComponent(
          token
        )}`;

      window.history.pushState(
        {
          signing: true,
          token,
        },
        '',
        newUrl
      );

      setClientToken(token);
      setClientContract(match.contract);
      setClientRole(match.role);
      setTokenError(false);
    } catch (error) {
      console.error(
        'Failed to open signing page:',
        error
      );

      setClientToken(token);
      setClientContract(null);
      setClientRole(null);
      setTokenError(true);
    }
  };

  // =========================================================
  // RETURN TO ADMIN
  // =========================================================

  const handleBackToAdmin = async () => {
    setClientToken(null);
    setClientContract(null);
    setClientRole(null);
    setTokenError(false);

    window.history.replaceState(
      {},
      '',
      window.location.origin
    );

    try {
      const loaded =
        await fetchContractsFromDatabase();

      setContracts(loaded);
    } catch (error) {
      console.error(
        'Failed to refresh contracts:',
        error
      );

      setContracts(getStoredContracts());
    }
  };

  // =========================================================
  // SAVE CONTRACT
  // =========================================================

  const handleSaveContract = async (
    contract: ContractDetails
  ) => {
    try {
      /*
       * saveContract() creates/preserves the permanent
       * employer and worker tokens.
       */
      const savedContract =
        await saveContract(contract);

      /*
       * Use the actual saved contract immediately.
       */
      setSelectedContract(savedContract);

      /*
       * Refresh from Google Sheets.
       */
      const updatedContracts =
        await fetchContractsFromDatabase();

      setContracts(updatedContracts);

      /*
       * Find the database version.
       */
      const databaseContract =
        updatedContracts.find(
          (item) =>
            item.id === savedContract.id
        );

      setSelectedContract(
        databaseContract || savedContract
      );

      setActiveView('preview');
    } catch (error) {
      console.error(
        'Failed to save contract:',
        error
      );

      /*
       * Keep UI responsive if database request fails.
       */
      setContracts(getStoredContracts());
      setSelectedContract(contract);
      setActiveView('preview');

      alert(
        'The contract could not be saved to the database. Please check your Apps Script connection.'
      );
    }
  };

  // =========================================================
  // DELETE CONTRACT
  // =========================================================

  const handleDeleteContract = async (
    id: string
  ) => {
    if (
      !confirm(
        'Are you sure you want to delete this contract?'
      )
    ) {
      return;
    }

    try {
      await deleteContract(id);

      const updatedContracts =
        await fetchContractsFromDatabase();

      setContracts(updatedContracts);

      if (selectedContract?.id === id) {
        setSelectedContract(null);
        setActiveView('list');
      }
    } catch (error) {
      console.error(
        'Failed to delete contract:',
        error
      );

      alert(
        'The contract could not be deleted. Please check your Apps Script connection.'
      );
    }
  };

  // =========================================================
  // SIGNATURE COMPLETED
  // =========================================================

  const handleClientSignatureComplete = async (
    updated: ContractDetails
  ) => {
    /*
     * Immediately keep the signed contract visible.
     */
    setClientContract(updated);

    try {
      /*
       * Refresh Google Sheets.
       */
      const refreshed =
        await fetchContractsFromDatabase();

      setContracts(refreshed);

      /*
       * Find the newest database version.
       */
      const refreshedContract =
        refreshed.find(
          (contract) =>
            contract.id === updated.id
        );

      if (refreshedContract) {
        setClientContract(
          refreshedContract
        );

        if (
          selectedContract?.id ===
          updated.id
        ) {
          setSelectedContract(
            refreshedContract
          );
        }
      }
    } catch (error) {
      console.error(
        'Failed to refresh contract after signature:',
        error
      );

      /*
       * Keep the signed contract visible.
       */
      setContracts(getStoredContracts());

      if (
        selectedContract?.id ===
        updated.id
      ) {
        setSelectedContract(updated);
      }
    }

    /*
     * IMPORTANT:
     *
     * We do NOT change the browser URL here.
     *
     * The original signing token remains active.
     */
  };

  // =========================================================
  // CLIENT SIGNING PAGE
  // =========================================================

  if (clientToken) {
    if (
      tokenError ||
      !clientContract ||
      !clientRole
    ) {
      return (
        <ExpiredLinkView
          reason="This digital signing link was not found or has expired."
        />
      );
    }

    return (
      <ClientSigningPage
        contract={clientContract}
        role={clientRole}
        onSignatureComplete={
          handleClientSignatureComplete
        }
      />
    );
  }

  // =========================================================
  // ADMIN CONTRACT PORTAL
  // =========================================================

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col">

      {/* Admin Navigation */}

      <header className="bg-white border-b border-neutral-300 border-t-4 border-t-[#235c27] no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 py-2 flex items-center justify-between">

          <div
            onClick={() => {
              setActiveView('list');
              setSelectedContract(null);
              setEditingContract(null);
            }}
            className="cursor-pointer flex items-center gap-3"
          >
            <MilestoneLogo
              size="sm"
              showTagline={false}
            />

            <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-[#52247f] border-l border-neutral-300 pl-3">
              Contract Sign
            </span>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">

            <button
              onClick={() => {
                setActiveView('list');
                setSelectedContract(null);
                setEditingContract(null);
              }}
              className={`text-xs font-semibold px-3 py-2 transition-colors cursor-pointer ${
                activeView === 'list'
                  ? 'bg-[#52247f] text-white shadow-sm'
                  : 'text-neutral-700 hover:text-neutral-950 border border-neutral-300 bg-white'
              }`}
            >
              Contracts
            </button>

            <button
              onClick={() => {
                setEditingContract(null);
                setActiveView('create');
              }}
              className={`text-xs font-semibold px-3 py-2 transition-colors cursor-pointer ${
                activeView === 'create'
                  ? 'bg-[#52247f] text-white shadow-sm'
                  : 'text-neutral-700 hover:text-neutral-950 border border-neutral-300 bg-white'
              }`}
            >
              Create Contract
            </button>

            <button
              onClick={() => {
                setActiveView('location');
              }}
              className={`text-xs font-semibold px-3 py-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                activeView === 'location'
                  ? 'bg-[#235c27] text-white shadow-sm'
                  : 'text-neutral-700 hover:text-neutral-950 border border-neutral-300 bg-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Office & Map
            </button>

          </nav>
        </div>
      </header>

      {/* Main Content */}

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8">

        {/* Contracts List */}

        {activeView === 'list' && (
          <AdminContractsList
            contracts={contracts}

            onCreateClick={() => {
              setEditingContract(null);
              setActiveView('create');
            }}

            onPreviewClick={(contract) => {
              setSelectedContract(contract);
              setActiveView('preview');
            }}

            onEditClick={(contract) => {
              setEditingContract(contract);
              setActiveView('create');
            }}

            onSendClick={(contract) => {
              setSelectedContract(contract);
              setActiveView('preview');
            }}

            onDeleteClick={
              handleDeleteContract
            }

            onDownloadClick={async (
              contract
            ) => {
              setSelectedContract(contract);
              setActiveView('preview');

              setTimeout(() => {
                downloadContractPdf(
                  'admin-contract-view',
                  contract.contractNumber
                );
              }, 200);
            }}

            onViewLocationClick={() =>
              setActiveView('location')
            }
          />
        )}

        {/* Create Contract */}

        {activeView === 'create' && (
          <AdminCreateContract
            initialContract={
              editingContract
            }

            onSave={handleSaveContract}

            onCancel={() => {
              setActiveView('list');
              setEditingContract(null);
            }}
          />
        )}

        {/* Contract Preview */}

        {activeView === 'preview' &&
          selectedContract && (
            <AdminContractPreview
              contract={selectedContract}

              onBack={() => {
                setActiveView('list');
                setSelectedContract(null);
              }}

              onEdit={() => {
                setEditingContract(
                  selectedContract
                );

                setActiveView('create');
              }}

              onUpdateContract={(updated) => {
                setSelectedContract(updated);

                setContracts(
                  getStoredContracts()
                );
              }}

              onOpenSigningPage={
                handleOpenClientSigning
              }
            />
          )}

        {/* Office & Map */}

        {activeView === 'location' && (
          <MilestoneLocationProfile
            onBackToContracts={() =>
              setActiveView('list')
            }

            onCreateContractClick={() => {
              setEditingContract(null);
              setActiveView('create');
            }}
          />
        )}

      </main>

      {/* Footer */}

      <footer className="bg-white border-t border-[#235c27] py-4 px-6 text-center text-xs text-neutral-600 no-print">

        <p className="font-bold text-[#52247f]">
          Milestone Domestic Services Ltd
        </p>

        <p className="text-neutral-600 mt-0.5">
          Agenda - kyaliwajjala road Agenda,
          Kyaliwajjala - Naalya Rd, Kampala,
          Uganda • Tel: 0701 761271
        </p>

        <div className="mt-2 flex items-center justify-center gap-3 text-[11px]">

          <button
            onClick={() =>
              setActiveView('location')
            }
            className="text-[#235c27] font-semibold hover:underline cursor-pointer"
          >
            See Photos & Map of Milestone Domestic Services
          </button>

          <span>•</span>

          <a
            href="tel:0701761271"
            className="text-[#52247f] font-semibold hover:underline"
          >
            Call: 0701 761271
          </a>

          <span>•</span>

          <span className="text-neutral-500">
            Professionalizing domestic work
          </span>

        </div>

      </footer>
    </div>
  );
}