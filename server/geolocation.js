import axios from 'axios';

export class GeolocationService {
  /**
   * Attempts to resolve geolocation for an IP using a fallback chain.
   * Primary: ipwho.is
   * Fallback 1: ipapi.co
   * Fallback 2: IPinfo
   */
  static async getGeolocation(ip) {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      // Mock local IP to Saudi Arabia for local testing consistency
      ip = '77.30.217.227';
    }

    try {
      // 1. Primary: ipwho.is
      const res1 = await axios.get(`https://ipwho.is/${ip}`, { timeout: 3000 });
      if (res1.data && res1.data.success) {
        return this.normalizeIpWhoIs(res1.data);
      }
    } catch (e) {
      console.warn(`[Geolocation] Primary provider (ipwho.is) failed for ${ip}: ${e.message}`);
    }

    try {
      // 2. Fallback: ipapi.co
      const res2 = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
      if (res2.data && !res2.data.error) {
        return this.normalizeIpApi(res2.data);
      }
    } catch (e) {
      console.warn(`[Geolocation] Fallback provider 1 (ipapi.co) failed for ${ip}: ${e.message}`);
    }

    try {
      // 3. Fallback: ipinfo.io
      const res3 = await axios.get(`https://ipinfo.io/${ip}/json`, { timeout: 3000 });
      if (res3.data && !res3.data.error) {
        return this.normalizeIpInfo(res3.data, ip);
      }
    } catch (e) {
      console.warn(`[Geolocation] Fallback provider 2 (ipinfo.io) failed for ${ip}: ${e.message}`);
    }

    return null;
  }

  static normalizeIpWhoIs(data) {
    return {
      ip: data.ip,
      country: data.country,
      country_code: data.country_code,
      region: data.region,
      city: data.city,
      currency: data.currency ? data.currency.code : null,
      timezone: data.timezone ? data.timezone.id : null,
      latitude: data.latitude,
      longitude: data.longitude,
      isp: data.connection ? data.connection.isp : null
    };
  }

  static normalizeIpApi(data) {
    return {
      ip: data.ip,
      country: data.country_name,
      country_code: data.country_code,
      region: data.region,
      city: data.city,
      currency: data.currency,
      timezone: data.timezone,
      latitude: data.latitude,
      longitude: data.longitude,
      isp: data.org
    };
  }

  static normalizeIpInfo(data, ip) {
    let lat = null, lon = null;
    if (data.loc) {
      const parts = data.loc.split(',');
      if (parts.length === 2) {
        lat = parseFloat(parts[0]);
        lon = parseFloat(parts[1]);
      }
    }
    return {
      ip: ip,
      country: data.country,
      country_code: data.country,
      region: data.region,
      city: data.city,
      currency: null, // ipinfo doesn't return currency on free tier
      timezone: data.timezone,
      latitude: lat,
      longitude: lon,
      isp: data.org
    };
  }
}
