import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

const Header = ({ children, className }: HeaderProps) => {
  return (
    <div className={cn("header", className)}>
      <Link href='/' className="flex items-center md:flex-1">
        <Image 
          src="/assets/images/logo.png"
          alt="Logo"
          width={32}
          height={32}
          className="mr-2"
        />
        <p className="text-2xl font-bold hidden md:block">EchoDocs</p>
      </Link>
      {children}
    </div>
  )
}

export default Header