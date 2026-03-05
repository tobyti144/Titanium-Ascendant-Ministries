/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// --- Data Definitions ---

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
        id: 'doc-3',
        name: 'Project_Alpha_Specs.pdf',
        type: 'PDF Document',
        category: 'document',
        date: 'Jan 15, 2026',
        description: 'Technical specifications for Project Alpha.',
        icon: 'fas fa-file-pdf text-red-600'
    },
    {
        id: 'media-1',
        name: 'Asset_4272.jpg',
        type: 'Image / JPEG',
        category: 'media',
        date: 'Feb 10, 2026',
        description: 'Site survey photo from Sector 7.'
    },
    {
        id: 'media-2',
        name: 'Asset_2228.png',
        type: 'Image / PNG',
        category: 'media',
        date: 'Feb 12, 2026',
        description: 'UI Mockup for the internal dashboard.'
    },
    {
        id: 'media-3',
        name: 'Asset_5379.jpg',
        type: 'Image / JPEG',
        category: 'media',
        date: 'March 1, 2026',
        description: 'Team building event photo.'
    },
    {
        id: 'data-1',
        name: 'Facebook_Export_Data_1',
        type: 'application/octet-stream',
        category: 'data',
        date: 'March 2, 2026',
        description: 'Social media trend analysis data export.'
    },
    {
        id: 'data-2',
        name: 'Facebook_Export_Data_2',
        type: 'application/octet-stream',
        category: 'data',
        date: 'March 2, 2026',
        description: 'Extended social media trend analysis data export.'
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
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </span>
                        <button class="text-gray-400 hover:text-blue-600"><i class="fas fa-download"></i></button>
                    </div>
                </div>
            `;
        } else if (item.category === 'media' && mediaGrid) {
            mediaGrid.innerHTML += `
                <div class="bg-white rounded-lg border border-gray-200 shadow-sm archive-card overflow-hidden group">
                    <div class="aspect-w-1 aspect-h-1 bg-gray-200 relative flex items-center justify-center h-40">
                        <i class="fas fa-image text-gray-400 text-3xl"></i>
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button class="text-white bg-blue-600 p-2 rounded-full hover:bg-blue-700"><i class="fas fa-eye"></i></button>
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
                            <i class="fas fa-database text-blue-600 mr-3 text-lg"></i>
                            <div class="text-sm font-medium text-gray-900">${item.name}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.type}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" class="text-blue-600 hover:text-blue-900">View</a>
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
        button.classList.remove('active', 'text-blue-600', 'border-blue-500');
        button.classList.add('border-transparent', 'text-gray-500');
    });

    const targetTab = document.getElementById('tab-' + tabName);
    if (targetTab) targetTab.classList.add('active');

    const activeBtn = document.getElementById('btn-' + tabName);
    if (activeBtn) {
        activeBtn.classList.add('active', 'text-blue-600', 'border-blue-500');
        activeBtn.classList.remove('border-transparent', 'text-gray-500');
    }
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
            contents: `You are a Digital Librarian. A user is asking about the archive. 
            Archive Contents:
            ${archiveContext}
            
            User Query: ${query}
            
            Provide a helpful, concise response based ONLY on the archive contents above. If you can't find anything relevant, say so politely.`
        });

        const text = response.text || 'No response from librarian.';
        responseText.innerHTML = await marked.parse(text);
    } catch (error) {
        console.error('AI Error:', error);
        responseText.innerHTML = 'Sorry, I encountered an error while searching the archive.';
    }
}

// --- Initialization ---

function init() {
    // Event Listeners
    document.getElementById('btn-documents')?.addEventListener('click', () => openTab('documents'));
    document.getElementById('btn-media')?.addEventListener('click', () => openTab('media'));
    document.getElementById('btn-data')?.addEventListener('click', () => openTab('data'));
    
    document.getElementById('search-input')?.addEventListener('input', renderArchive);
    document.getElementById('ai-ask-btn')?.addEventListener('click', askLibrarian);

    // Initial Render
    renderArchive();
}

window.addEventListener('DOMContentLoaded', init);
