import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Tv } from 'lucide-react';
import { claimTvCode, getTvDevices, unpairTvDevice } from '../api';
import type { TvDevice } from '../types';

export const PairTv = () => {
	const [code, setCode] = useState('');
	const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
	const [devices, setDevices] = useState<TvDevice[]>([]);

	const loadDevices = () => getTvDevices().then(setDevices).catch(console.error);

	useEffect(() => {
		loadDevices();
	}, []);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			await claimTvCode(code);
			setMessage({ ok: true, text: 'TV paired! Your workouts will appear on it in a few seconds.' });
			setCode('');
			loadDevices();
		} catch {
			setMessage({ ok: false, text: "That code didn't work. Check the code on your TV and try again." });
		}
	};

	const handleUnpair = async (id: number) => {
		if (confirm('Unpair this TV? It will need a new code to show your workouts again.')) {
			await unpairTvDevice(id);
			loadDevices();
		}
	};

	return (
		<div className="max-w-3xl mx-auto p-6">
			<Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6">
				<ArrowLeft size={20} /> Back to Dashboard
			</Link>

			<h1 className="text-3xl font-bold text-gray-900 mb-2">Pair a TV</h1>
			<p className="text-gray-600 mb-8">Open Gruuve on your TV and enter the code it shows.</p>

			<form onSubmit={handleSubmit} className="flex gap-3 mb-4">
				<input
					value={code}
					onChange={(e) => setCode(e.target.value.toUpperCase())}
					placeholder="ABC123"
					maxLength={6}
					autoCapitalize="characters"
					autoComplete="off"
					className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-2xl tracking-[0.3em] font-mono uppercase"
				/>
				<button
					type="submit"
					disabled={code.trim().length !== 6}
					className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
				>
					Pair
				</button>
			</form>
			{message && (
				<p className={`mb-8 ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>
			)}

			<h2 className="text-xl font-semibold text-gray-900 mt-10 mb-4">Paired TVs</h2>
			<div className="grid gap-3">
				{devices.map((device) => (
					<div
						key={device.id}
						className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
					>
						<div className="flex items-center gap-3">
							<Tv className="text-gray-400" />
							<div>
								<p className="font-medium text-gray-900">{device.name || 'TV'}</p>
								{device.pairedAt && (
									<p className="text-sm text-gray-500">
										Paired {new Date(device.pairedAt).toLocaleDateString()}
									</p>
								)}
							</div>
						</div>
						<button
							onClick={() => handleUnpair(device.id)}
							className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
							aria-label="Unpair TV"
						>
							<Trash2 size={20} />
						</button>
					</div>
				))}
				{devices.length === 0 && <p className="text-gray-500">No TVs paired yet.</p>}
			</div>
		</div>
	);
};
