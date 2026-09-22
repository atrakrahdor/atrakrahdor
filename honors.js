(function () {
    'use strict';

    window.renderAtrakHonors = async function (containerId) {
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn('بخش افتخارآفرینان پیدا نشد:', containerId);
            return;
        }

        container.innerHTML = `
            <div class="atrak-honors-loading">
                در حال بارگذاری افتخارآفرینان...
            </div>
        `;

        try {
            if (typeof supabaseClient === 'undefined') {
                throw new Error('Supabase Client پیدا نشد.');
            }

            const { data, error } = await supabaseClient
                .from('honors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="atrak-honors-empty">
                        هنوز افتخارآفرینی ثبت نشده است.
                    </div>
                `;
                return;
            }

            container.innerHTML = data.map(item => `
                <div class="atrak-honor-card">
                    ${
                        item.image_url
                            ? `<img src="${item.image_url}" alt="${item.name || 'افتخارآفرین'}">`
                            : ''
                    }

                    <div class="atrak-honor-card-content">
                        <h3>${item.name || ''}</h3>

                        ${
                            item.description
                                ? `<p>${item.description}</p>`
                                : ''
                        }
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error(
                'خطا در بارگذاری افتخارآفرینان:',
                error
            );

            container.innerHTML = `
                <div class="atrak-honors-error">
                    خطا در بارگذاری اطلاعات افتخارآفرینان.
                </div>
            `;
        }
    };

})();
