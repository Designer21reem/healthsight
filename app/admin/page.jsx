"use client";
import React, { useState } from 'react';
import TopNav from '../../components/Admin/TopNav';
import MapPanel from '../../components/Admin/MapPanel';
import AnalysisPanel from '../../components/Admin/AnalysisPanel';
import UsersPanel from '../../components/Admin/UsersPanel';
import ArticlesPanel from '../../components/Admin/ArticlesPanel';

export default function AdminPage() {
	const [active, setActive] = useState('map');

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="mx-auto max-w-7xl">
				<TopNav active={active} onChange={setActive} />

				<main>
					{active === 'map' && <MapPanel />}
					{active === 'analysis' && <AnalysisPanel />}
					{active === 'users' && <UsersPanel />}
					{active === 'articles' && <ArticlesPanel />}
				</main>
			</div>
		</div>
	);
}

