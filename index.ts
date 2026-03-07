/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { saveAs } from 'file-saver';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// --- Data Definitions ---

const SELECTED_PARCEL = "Target Zone Gamma: 20+ Acres, Wooded Backroad Parcel, East of Route 104/Lake White Intersection, Waverly, OH";

interface ArchiveItem {
    id: string;
    name: string;
    type: string;
    category: 'document' | 'media' | 'data';
    date: string;
    description: string;
    icon?: string;
}

const ARCHIVE_DATA: ArchiveItem[] = [
    {
        id: 'ta-core-1',
        name: 'Articles_of_Incorporation',
        type: 'Legal Document',
        category: 'document',
        date: 'March 7, 2026',
        description: 'ARTICLES OF INCORPORATION OF TITANIUM ASCENDANT INCORPORATION (A Non-Profit Ohio Corporation).',
        icon: 'fas fa-file-contract text-indigo-600'
    },
    {
        id: 'ta-core-2',
        name: 'Financial_Plan_Summary',
        type: 'Financial Strategy',
        category: 'document',
        date: 'March 7, 2026',
        description: 'Expected Annual Gross Target: $2,500,000 USD. Breakdown for Ministries, Studios, and Starchive.',
        icon: 'fas fa-file-invoice-dollar text-indigo-600'
    },
    {
        id: 'ta-core-3',
        name: 'Independent_Contractor_Agreement',
        type: 'Legal Template',
        category: 'document',
        date: 'March 7, 2026',
        description: 'Standard agreement for Titanium Ascendant / Titanium Production Studios contractors.',
        icon: 'fas fa-file-signature text-indigo-600'
    },
    {
        id: 'ta-exp-1',
        name: 'Lake_White_Grant_Proposal',
        type: 'Grant Proposal',
        category: 'document',
        date: 'March 7, 2026',
        description: 'Proposal for the Lake White Connectivity & Broadcast Hub in Waverly, Ohio.',
        icon: 'fas fa-broadcast-tower text-indigo-600'
    },
    {
        id: 'ta-exp-2',
        name: 'Waverly_Ground_Lease_LOI',
        type: 'Letter of Intent',
        category: 'document',
        date: 'March 7, 2026',
        description: 'LOI for ground lease and commercial development near Lake White.',
        icon: 'fas fa-map-marked-alt text-indigo-600'
    },
    {
        id: 'ta-1',
        name: 'Titanium_Ascendant_Charter.pdf',
        type: 'Official Charter',
        category: 'document',
        date: 'March 7, 2026',
        description: 'The founding principles and governance structure of Titanium Ascendant.',
        icon: 'fas fa-file-contract text-indigo-600'
    },
    {
        id: 'ta-2',
        name: 'Incorporation_Papers_2026.docx',
        type: 'Legal Document',
        category: 'document',
        date: 'March 5, 2026',
        description: 'Official incorporation documents for the global entity.',
        icon: 'fas fa-file-signature text-indigo-600'
    },
    {
        id: 'ta-3',
        name: 'Strategic_Vision_2030.pdf',
        type: 'Strategic Plan',
        category: 'document',
        date: 'March 6, 2026',
        description: 'Long-term roadmap for technological and social integration.',
        icon: 'fas fa-file-alt text-indigo-600'
    },
    {
        id: 'doc-1',
        name: 'Titanium_Memoirs.pdf',
        type: 'Compressed PDF Document',
        category: 'document',
        date: 'March 2, 2026',
        description: 'Personal accounts of the Titanium era explorations.',
        icon: 'fas fa-file-pdf text-red-600'
    },
    {
        id: 'doc-2',
        name: 'HR_Policies_Draft.docx',
        type: 'Word Document',
        category: 'document',
        date: 'Feb 27, 2026',
        description: 'Draft policies for the upcoming fiscal year.',
        icon: 'fas fa-file-word text-blue-600'
    },
    {
        id: 'media-1',
        name: 'Titanium_Ascendant_Logo.png',
        type: 'Image / PNG',
        category: 'media',
        date: 'March 7, 2026',
        description: 'Official high-resolution branding asset.'
    },
    {
        id: 'media-2',
        name: 'Asset_4272.jpg',
        type: 'Image / JPEG',
        category: 'media',
        date: 'Feb 10, 2026',
        description: 'Site survey photo from Sector 7.'
    },
    {
        id: 'data-1',
        name: 'Titanium_Network_Logs_001',
        type: 'application/octet-stream',
        category: 'data',
        date: 'March 7, 2026',
        description: 'Encrypted network activity logs for the primary node.'
    },
    {
        id: 'data-2',
        name: 'Facebook_Export_Data_1',
        type: 'application/octet-stream',
        category: 'data',
        date: 'March 2, 2026',
        description: 'Social media trend analysis data export.'
    },
    {
        id: 'fin-1',
        name: 'Tiered_Banking_Strategy_2026',
        type: 'Financial Strategy',
        category: 'data',
        date: 'March 7, 2026',
        description: 'Tiered banking framework featuring Mercury (Digital), Chase Private (Legacy), and Relay FI (Operational).'
    }
];

// --- UI Logic ---

function renderArchive() {
    const docGrid = document.getElementById('documents-grid');
    const mediaGrid = document.getElementById('media-grid');
    const dataTableBody = document.getElementById('data-table-body');
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const searchTerm = searchInput?.value.toLowerCase() || '';

    if (docGrid) docGrid.innerHTML = '';
    if (mediaGrid) mediaGrid.innerHTML = '';
    if (dataTableBody) dataTableBody.innerHTML = '';

    ARCHIVE_DATA.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.description.toLowerCase().includes(searchTerm)
    ).forEach(item => {
        if (item.category === 'document' && docGrid) {
            docGrid.innerHTML += `
                <div class="bg-white rounded-lg border border-gray-200 shadow-sm archive-card overflow-hidden">
                    <div class="p-5 flex items-start gap-4">
                        <div class="p-3 bg-gray-50 rounded-lg">
                            <i class="${item.icon || 'fas fa-file'} text-2xl"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-sm font-semibold text-gray-900 truncate">${item.name}</h3>
                            <p class="text-xs text-gray-500 mt-1">${item.type}</p>
                            <p class="text-xs text-gray-400 mt-2"><i class="far fa-clock mr-1"></i> ${item.date}</p>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </span>
                        <button class="text-gray-400 hover:text-indigo-600"><i class="fas fa-download"></i></button>
                    </div>
                </div>
            `;
        } else if (item.category === 'media' && mediaGrid) {
            mediaGrid.innerHTML += `
                <div class="bg-white rounded-lg border border-gray-200 shadow-sm archive-card overflow-hidden group">
                    <div class="aspect-w-1 aspect-h-1 bg-gray-200 relative flex items-center justify-center h-40">
                        <i class="fas fa-image text-gray-400 text-3xl"></i>
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button class="text-white bg-indigo-600 p-2 rounded-full hover:bg-indigo-700"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="p-3">
                        <p class="text-xs font-medium text-gray-900 truncate">${item.name}</p>
                        <p class="text-[10px] text-gray-500">${item.type}</p>
                    </div>
                </div>
            `;
        } else if (item.category === 'data' && dataTableBody) {
            dataTableBody.innerHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <i class="fas fa-database text-indigo-600 mr-3 text-lg"></i>
                            <div class="text-sm font-medium text-gray-900">${item.name}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.type}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" class="text-indigo-600 hover:text-indigo-900">View</a>
                    </td>
                </tr>
            `;
        }
    });
}

function openTab(tabName: string) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(button => {
        button.classList.remove('active', 'text-indigo-600', 'border-indigo-500');
        button.classList.add('border-transparent', 'text-gray-500');
    });

    const targetTab = document.getElementById('tab-' + tabName);
    if (targetTab) targetTab.classList.add('active');

    const activeBtn = document.getElementById('btn-' + tabName);
    if (activeBtn) {
        activeBtn.classList.add('active', 'text-indigo-600', 'border-indigo-500');
        activeBtn.classList.remove('border-transparent', 'text-gray-500');
    }
}

// --- Document Generation Logic ---

const TITANIUM_DOCS_CONTENT: Record<string, string> = {
    "Articles_of_Incorporation": `ARTICLES OF INCORPORATION OF TITANIUM ASCENDANT INCORPORATION
(A Non-Profit Ohio Corporation)
ARTICLE I: NAME - Titanium Ascendant Incorporation
ARTICLE II: PRINCIPAL OFFICE - City of Portsmouth, Scioto County, Ohio.
ARTICLE III: PURPOSE - Organized for charitable, religious, and educational purposes under Section 501(c)(3).`,
    
    "Financial_Plan_Summary": `Expected Annual Gross Target: $2,500,000 USD
Titanium Ascendant Ministries: $1,000,000 (40%)
Titanium Production Studio: $1,250,000 (50%)
Titanium Starchive (Admin): $250,000 (10%)`,

    "Independent_Contractor_Agreement": `This Independent Contractor Agreement is entered into by and between
Titanium Ascendant / Titanium Production Studios ("Company") and Contractor.
All work performed is considered "Work for Hire" and owned by the Company.`,

    "Lake_White_Grant_Proposal": `PROJECT TITLE: The Titanium Ascendant Lake White Connectivity & Broadcast Hub
APPLICANT: Titanium Ascendant Ministries (501c3) & Titanium Production Studios (FCC FRN: 0038034708)
LOCATION: Route 104 Corridor, Lake White region, Waverly, Pike County, Ohio

I. EXECUTIVE SUMMARY
Titanium Ascendant Incorporation seeks capital funding to acquire land and develop a state-of-the-art media broadcasting and community outreach facility on the hills surrounding Lake White in Waverly, Ohio. This facility will serve a dual mandate: (1) Act as the global broadcasting headquarters for a verified media network, and (2) Serve as a vital rural connectivity, emergency broadcast, and pastoral telehealth anchor for the critically underserved backroads of Pike County.

II. STATEMENT OF NEED
The topographical challenges of the hills surrounding Lake White and the Route 104 backroads have created severe cellular and broadband "dead zones," isolating vulnerable Appalachian populations from emergency services and modern economic participation.

III. PROJECT OBJECTIVES & THE TITANIUM SOLUTION
1. FCC-Registered Emergency Broadcasting: Reliable emergency alerts.
2. Satellite & Wi-Fi Extender Infrastructure: Mounting commercial-grade satellite repeaters on the Titanium Studio towers to beam connectivity into dead zones.
3. Community Healing Center: A physical 501(c)(3) operational base coordinating mutual aid and mental health outreach.

IV. MEASURABLE IMPACT
This facility will stand as an architectural monolith in Pike County, generating local jobs, attracting tech contractors, and permanently erasing the connectivity gap for residents surrounding Lake White.`,

    "Waverly_Ground_Lease_LOI": `SUBJECT: Letter of Intent for Ground Lease and Commercial Development
DATE: March 7, 2026
TENANT/DEVELOPER: Titanium Ascendant Incorporation (Rev. Toby Ti Mustard, CEO)
PROPERTY LOCATION: ${SELECTED_PARCEL}

1. PROPOSED TRANSACTION:
The Tenant proposes to enter into a long-term Ground Lease with the Landowner to construct a new commercial broadcasting facility and non-profit headquarters.

2. LEASE TERM & RENEWAL:
Initial Term: Ninety-nine (99) years. Base Rent to commence upon completion of the Due Diligence and Zoning Period.

3. BUILD-TO-SUIT & DEVELOPMENT RIGHTS:
Tenant shall have the absolute right to construct a multi-story, secure broadcasting facility and communication towers on the premises. Tenant assumes all costs associated with construction and utility trenching. All improvements and infrastructure built upon the land shall remain the sole property and Intellectual Property of Titanium Ascendant Incorporation.

4. ZONING & DUE DILIGENCE CONTINGENCY:
Agreement is fully contingent upon Tenant securing necessary commercial zoning permits, FCC tower clearances, and environmental approvals. Tenant requires a ninety (90) day survey period.

5. EXCLUSIVITY & NON-DISCLOSURE:
Upon signing, the Landowner agrees to remove the property from the public market and sign a Non-Disclosure Agreement (NDA) regarding the architectural blueprints of the Titanium project.

Signatures:
Chief Executive, Titanium Ascendant: ____________________ Date: ________
Property Owner / Landlord: ___________________________ Date: ________`
};

async function generatePDF(filename: string, content: string) {
    const doc = new jsPDF();
    const lines = content.split('\n');
    let y = 10;
    lines.forEach(line => {
        doc.text(line, 10, y);
        y += 10;
    });
    doc.save(`${filename}.pdf`);
}

async function generateDOCX(filename: string, content: string) {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: filename.replace(/_/g, ' '),
                    heading: HeadingLevel.HEADING_1,
                }),
                ...content.split('\n').map(line => new Paragraph({
                    children: [new TextRun(line)],
                })),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
}

async function handleBatchGeneration() {
    const btn = document.getElementById('generate-docs-btn');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        btn.setAttribute('disabled', 'true');
    }

    try {
        for (const [title, content] of Object.entries(TITANIUM_DOCS_CONTENT)) {
            await generatePDF(title, content);
            await generateDOCX(title, content);
        }

        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 left-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-bounce';
        notification.innerHTML = '<i class="fas fa-check-circle"></i> Batch Generation Complete. Check your downloads.';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);

    } catch (error) {
        console.error('Generation Error:', error);
    } finally {
        if (btn) {
            btn.innerHTML = '<i class="fas fa-file-export"></i> Generate Core Docs';
            btn.removeAttribute('disabled');
        }
    }
}

// --- Cloud Sync Logic ---

async function syncCloud() {
    const syncBtn = document.getElementById('sync-btn');
    const syncStatus = document.getElementById('sync-status');
    
    if (!syncBtn || !syncStatus) return;

    const originalContent = syncBtn.innerHTML;
    syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
    syncBtn.setAttribute('disabled', 'true');

    // Simulate cloud backup process
    await new Promise(resolve => setTimeout(resolve, 2500));

    syncBtn.innerHTML = originalContent;
    syncBtn.removeAttribute('disabled');
    
    syncStatus.classList.remove('hidden');
    syncStatus.classList.add('flex');
    
    // Show a temporary success toast or notification
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-bounce';
    notification.innerHTML = '<i class="fas fa-check-circle"></i> Titanium Ascendant Cloud Backup Complete';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// --- AI Librarian Logic ---

async function askLibrarian() {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const responseContainer = document.getElementById('ai-response-container');
    const responseText = document.getElementById('ai-response-text');
    const query = searchInput?.value;

    if (!query || !responseText || !responseContainer) return;

    responseContainer.classList.remove('hidden');
    responseText.innerHTML = 'Thinking...';

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });
        const model = 'gemini-2.0-flash';
        
        const archiveContext = ARCHIVE_DATA.map(item => 
            `- ${item.name} (${item.type}): ${item.description}`
        ).join('\n');

        const response = await ai.models.generateContent({
            model: model,
            contents: `You are the Starchive AI Librarian for Titanium Ascendant. 
            Your purpose is to help manage and retrieve the life's work of the founder.
            
            Archive Contents (Titanium Ascendant Incorporation, Financials, & Memoirs):
            ${archiveContext}
            
            Core Documents Available for Generation:
            - Articles of Incorporation
            - Financial Plan Summary
            - Independent Contractor Agreement
            - Lake White Grant Proposal
            - Waverly Ground Lease LOI
            
            Banking Strategy:
            - Mercury (Digital Engine): Best for global media/broadcasting, $5M FDIC, zero fees, 4-5% APY.
            - Chase Private/PNC (Legacy Anchor): Best for Ministry/Outreach, dedicated relationship manager, physical presence.
            - Relay FI (Agile Alternative): Best for multi-fund management, 20 checking accounts, team-based controls.
            
            Payroll & Personnel:
            - Titanium Payroll Logic: Automated disbursement via Stripe Connect when treasury thresholds are met.
            - Priority: Employees (Outreach) and Directors paid first, followed by Board stipends.
            - Personnel: Rev. Toby Ti Mustard (CEO), Director 2 (Outreach), Director 3 (Studio), Senior Grant Writer.
            
            User Query: ${query}
            
            Guidelines:
            - Be professional, loyal, and highly efficient.
            - Provide helpful, concise responses based ONLY on the archive contents.
            - If asked about document generation (like fpdf or docx), explain that you can assist in drafting content which can then be exported via our integrated Node.js processing systems.
            - If you can't find anything relevant, say so politely.`
        });

        const text = response.text || 'No response from librarian.';
        responseText.innerHTML = await marked.parse(text);
    } catch (error) {
        console.error('AI Error:', error);
        responseText.innerHTML = 'Sorry, I encountered an error while searching the archive.';
    }
}

// --- Ministry & Studio Simulated Data ---

const VOLUNTEER_DATA = [
    { name: "John Doe", skills: "Logistics, Outreach", status: "Active" },
    { name: "Jane Smith", skills: "Pastoral Care, Telehealth", status: "Active" },
    { name: "Robert Pike", skills: "Construction, Trenching", status: "Pending" }
];

const EQUIPMENT_DATA = [
    { name: "Titanium Studio Camera A1", serial: "TS-CAM-001", value: "$45,000", status: "In Use" },
    { name: "Satellite Repeater Node 7", serial: "TS-NODE-007", value: "$12,500", status: "Deployed" },
    { name: "Broadcast Tower Array", serial: "TS-TWR-99", value: "$120,000", status: "Active" }
];

function renderMinistry() {
    const ministryViewVolunteers = document.getElementById('ministry-view-volunteers');
    const starchiveVolunteersList = document.getElementById('ministry-volunteers-list');

    const renderList = (container: HTMLElement | null) => {
        if (!container) return;
        container.innerHTML = VOLUNTEER_DATA.map(v => `
            <div class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded shadow-sm">
                <div>
                    <div class="text-sm font-bold text-gray-900">${v.name}</div>
                    <div class="text-[10px] text-gray-500">${v.skills}</div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${v.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                    ${v.status}
                </span>
            </div>
        `).join('');
    };

    renderList(ministryViewVolunteers);
    renderList(starchiveVolunteersList);
}

const PERSONNEL_DATA = [
    { name: "Rev. Toby Ti Mustard", role: "Chief Executive", salary: "$15,000.00", status: "Active", lastPay: "March 1, 2026" },
    { name: "Director 2", role: "Director (Outreach)", salary: "$8,500.00", status: "Active", lastPay: "March 1, 2026" },
    { name: "Director 3", role: "Director (Studio)", salary: "$8,500.00", status: "Active", lastPay: "March 1, 2026" },
    { name: "Senior Grant Writer", role: "Employee", salary: "$6,000.00", status: "Pending", lastPay: "N/A" }
];

function renderPersonnel() {
    const tableBody = document.getElementById('personnel-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = PERSONNEL_DATA.map(p => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="text-sm font-medium text-gray-900">${p.name}</div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.role}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">${p.salary}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.lastPay}</td>
        </tr>
    `).join('');
}

async function triggerPayroll() {
    const btn = document.getElementById('trigger-payroll-btn');
    if (!btn) return;

    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    btn.setAttribute('disabled', 'true');

    try {
        const response = await fetch('/.netlify/functions/auto-payroll', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            alert("Titanium Payroll Executed Successfully. All personnel funded.");
        } else {
            alert("Payroll Protection Active: " + result.message);
        }
    } catch (err) {
        console.error(err);
        alert("Network error. Ensure your Netlify functions are deployed.");
    } finally {
        btn.innerHTML = originalContent;
        btn.removeAttribute('disabled');
    }
}

function renderStudio() {
    // Add equipment manifest logic if needed
}

// --- Initialization ---

function handleRouting() {
    const hash = window.location.hash.replace('#', '') || 'master';
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById('view-' + hash);
    if (target) {
        target.classList.add('active');
    } else {
        document.getElementById('view-master')?.classList.add('active');
    }

    if (hash === 'starchive') {
        renderArchive();
    }
}

function init() {
    // Event Listeners
    document.getElementById('btn-documents')?.addEventListener('click', () => openTab('documents'));
    document.getElementById('btn-media')?.addEventListener('click', () => openTab('media'));
    document.getElementById('btn-data')?.addEventListener('click', () => openTab('data'));
    document.getElementById('btn-ministry-tab')?.addEventListener('click', () => openTab('ministry-tab'));
    document.getElementById('btn-banking')?.addEventListener('click', () => openTab('banking'));
    document.getElementById('btn-payroll')?.addEventListener('click', () => openTab('payroll'));
    
    document.getElementById('trigger-payroll-btn')?.addEventListener('click', triggerPayroll);
    
    document.getElementById('search-input')?.addEventListener('input', renderArchive);
    document.getElementById('ai-ask-btn')?.addEventListener('click', askLibrarian);
    document.getElementById('sync-btn')?.addEventListener('click', syncCloud);
    document.getElementById('generate-docs-btn')?.addEventListener('click', handleBatchGeneration);

    window.addEventListener('hashchange', handleRouting);
    handleRouting();
    renderMinistry();
    renderStudio();
    renderPersonnel();

    // Initial Render
    renderArchive();
}

window.addEventListener('DOMContentLoaded', init);
