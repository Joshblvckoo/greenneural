export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold mb-6">About GreenNeural</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          GreenNeural empowers developers, engineers, and sustainability teams with
          real-time climate intelligence. Our mission is to help organizations reduce
          digital carbon emissions, choose greener cloud regions, and understand climate
          risks affecting their workloads and infrastructure.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">What GreenNeural Does</h2>
        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          GreenNeural provides live carbon intensity data for AWS, Azure, and GCP regions,
          climate risk insights (heat, flood, air quality), SCI (Sustainability Compute
          Index) calculations, and greener region recommendations. It helps teams make
          environmentally responsible decisions without sacrificing performance.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Why Climate Intelligence Matters</h2>
        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          Cloud workloads contribute significantly to global emissions. Choosing cleaner
          regions, optimizing compute, and understanding climate risks can reduce carbon
          footprint by up to 60%. Climate intelligence enables smarter, greener decisions
          that benefit both the planet and your infrastructure.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">How Your Data Is Used</h2>
        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          GreenNeural only stores essential sustainability profile data such as preferred
          cloud provider, region, and climate interest. We never sell or share your data.
          All information is encrypted, protected with industry-standard security, and
          used solely to improve your climate insights and recommendations.
        </p>
      </section>
    </div>
  );
}
